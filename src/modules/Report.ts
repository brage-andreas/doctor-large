import {
	type APIEmbed,
	type APIEmbedAuthor,
	type Client,
	type Guild,
	type MessageCreateOptions,
	Routes,
} from "discord.js";
import { getMemberInfo, getTag, longstamp, messageToEmbed, messageURL, squash } from "#helpers";
import { type Prisma, type Report, type ReportType } from "@prisma/client";
import { type CaseWithIncludes, type ReportWithIncludes } from "#typings";
import { source, stripIndent, stripIndents } from "common-tags";
import type ReportManager from "#database/report.js";
import { ColorsHex, Emojis } from "#constants";
import components from "#discord-components";

export const isMessageReport = (
	data: Report
): data is Report & {
	targetMessageChannelId: string;
	targetMessageId: string;
} => Boolean(data.targetMessageChannelId) && Boolean(data.targetMessageId);

export class UserReportModule implements Omit<ReportWithIncludes, "targetMessageChannelId" | "targetMessageId"> {
	public anonymous!: boolean;
	public authorUserId!: string;
	public authorUsername!: string;
	public client!: Client<true>;

	public comment!: string;
	public createdAt!: Date;
	public data!: ReportWithIncludes;
	public guild!: Guild;
	public guildId!: string;
	public guildRelativeId!: number;
	public id!: number;
	public logChannelId!: null | string;
	public logMessageId!: null | string;
	public manager!: ReportManager;
	public processedAt!: Date | null;
	public processedByUserId!: null | string;
	public processedByUsername!: null | string;
	public referencedBy!: Array<CaseWithIncludes>;
	public targetUserId!: string;
	public targetUsername!: string;
	public type!: ReportType;

	public constructor(manager: ReportManager, data: ReportWithIncludes) {
		this._constructor(manager, data);
	}

	protected _constructor(manager: ReportManager, data: ReportWithIncludes) {
		this.client = manager.guild.client;
		this.data = data;
		this.guild = manager.guild;
		this.manager = manager;

		if (manager.guild.id !== data.guildId) {
			throw new TypeError(
				`Value 'manager.guild.id' (${manager.guild.id}) does not match 'data.guildId' (${data.guildId}).`
			);
		}

		this.anonymous = data.anonymous;
		this.authorUserId = data.authorUserId;
		this.authorUsername = data.authorUsername;
		this.comment = data.comment;
		this.createdAt = data.createdAt;
		this.guildId = data.guildId;
		this.guildRelativeId = data.guildRelativeId;
		this.id = data.id;
		this.logChannelId = data.logChannelId;
		this.logMessageId = data.logMessageId;
		this.processedAt = data.processedAt;
		this.processedByUserId = data.processedByUserId;
		this.processedByUsername = data.processedByUsername;
		this.referencedBy = data.referencedBy;
		this.targetUserId = data.targetUserId;
		this.targetUsername = data.targetUsername;
		this.type = data.type;
	}

	public async edit(data: Prisma.ReportUpdateInput) {
		const result = await this.manager.editRaw({
			data,
			where: { id: this.id },
		});

		this._constructor(this.manager, result);

		return this;
	}

	public async editLog(): Promise<boolean> {
		if (!this.logChannelId || !this.logMessageId) {
			return false;
		}

		const body = await this.generatePost();

		const fullRoute = Routes.channelMessage(this.logChannelId, this.logMessageId);

		return await this.client.rest
			.patch(fullRoute, { body })
			.then(() => true)
			.catch(() => false);
	}

	public async fetchTarget() {
		const member = await this.guild.members.fetch({ force: true, user: this.targetUserId }).catch(() => null);

		if (member) {
			return member;
		}

		return await this.client.users.fetch(this.targetUserId, { force: true }).catch(() => null);
	}

	protected generateBasePost(typeSpecificInformation?: null | string | undefined) {
		const rows = components.createRows.specific(2, 3)(
			components.buttons.memberInfo(this.targetUserId, "Target").component(),
			components.buttons.memberInfo(this.authorUserId, "Author").component(),
			// ---
			components.buttons.attachToLatestCase(this.id),
			this.referencedBy.length > 0 ? components.buttons.unattachReportFromCases(this.id) : null,
			// ---
			this.processedAt
				? components.buttons.markReportUnprocessed(this.id)
				: components.buttons.markReportProcessed(this.id)
		);

		const authorMention = this.anonymous ? "Anonymous user" : this.author;

		const ifProcessed =
			this.processedAt && this.processedBy
				? stripIndents`
					* At: ${longstamp(this.processedAt, { extraLong: true })}
					* By: ${this.processedBy}
				`
				: "";

		const emoji = this.processedAt ? Emojis.Check : Emojis.Cross;
		const content = squash(source`
			# [${emoji}] Report #${this.guildRelativeId}
			### ${this.type} report by ${authorMention}
			* Created ${longstamp(this.createdAt, { extraLong: true })}
			* User reported: ${this.target}
			* Processed: ${this.processedAt ? `${Emojis.Check} Yes` : `${Emojis.Cross} No`}
			 ${ifProcessed}
			### Author-provided comment:
			> ${this.comment}

			${typeSpecificInformation ?? ""}
		`).trim();

		return { components: rows, content };
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async generatePost(): Promise<MessageCreateOptions> {
		return this.generateBasePost();
	}

	public isMessageReport(): this is MessageReportModule {
		return isMessageReport(this.data);
	}

	public isUserReport(): this is UserReportModule {
		return !this.isMessageReport();
	}

	// Message module requires async
	public get author() {
		return getTag({
			id: this.authorUserId,
			tag: this.authorUsername,
		});
	}

	public get processedBy() {
		if (!this.processedByUserId || !this.processedByUsername) {
			return null;
		}

		return getTag({
			id: this.processedByUserId,
			tag: this.processedByUsername,
		});
	}

	public get target() {
		return getTag({
			id: this.targetUserId,
			tag: this.targetUsername,
		});
	}
}

export class MessageReportModule extends UserReportModule {
	public targetMessageChannelId: string;
	public targetMessageId: string;
	public targetMessageURL: string;

	public constructor(
		manager: ReportManager,
		data: ReportWithIncludes & {
			targetMessageChannelId: string;
			targetMessageId: string;
		}
	) {
		super(manager, data);

		this.targetMessageChannelId = data.targetMessageChannelId;
		this.targetMessageId = data.targetMessageId;
		this.targetMessageURL = messageURL(data.guildId, data.targetMessageChannelId, data.targetMessageId);
	}

	public async fetchTargetMessage() {
		const channel = this.guild.channels.cache.get(this.targetMessageChannelId);

		if (!channel?.isTextBased()) {
			return null;
		}

		return channel.messages.fetch(this.targetMessageId).catch(() => null);
	}

	public async generatePost(): Promise<MessageCreateOptions> {
		const message = await this.fetchTargetMessage();

		if (!message) {
			return this.generateBasePost(
				stripIndent`
					### Reported message
					* Message author: ${this.target}
					* [Message URL](<${this.targetMessageURL}>)
					(${Emojis.Warn} Could not update the preview of the message)
				`
			);
		}

		const base = this.generateBasePost(
			stripIndent`
				### Reported message
				* Author: ${this.target}
				* [Message URL](<${this.targetMessageURL}>)
				* Preview:
			`
		);

		const messageEmbed = messageToEmbed(message, { withIds: true });

		const messageButtonRow = components.createRows(
			components.buttons.previewMessage(message.channelId, message.id),
			components.buttons.url({ label: "Go to message", url: message.url })
		);

		return {
			...base,
			components: [...messageButtonRow, ...base.components],
			embeds: [messageEmbed],
		};
	}

	public async toEmbed(): Promise<APIEmbed> {
		const target =
			(await this.guild.members.fetch(this.targetUserId).catch(() => null)) ??
			(await this.client.users.fetch(this.targetUserId).catch(() => null));

		const fields = target ? getMemberInfo(target, "Target") : [];

		const author: APIEmbedAuthor = this.anonymous
			? { name: "Anonymous user" }
			: { name: `${this.author} (${this.authorUserId})` };

		return {
			author,
			color: this.processedAt ? ColorsHex.Green : ColorsHex.Red,
			fields,
			footer: { text: `Report #${this.guildRelativeId}` },
		};
	}
}
