import components from "#components";
import { ColorsHex, Emojis } from "#constants";
import type ReportManager from "#database/report.js";
import {
	getMemberInfo,
	getTag,
	longstamp,
	messageToEmbed,
	messageURL,
	squash
} from "#helpers";
import { type CaseWithIncludes, type ReportWithIncludes } from "#typings";
import { type Prisma, type Report, type ReportType } from "@prisma/client";
import { source, stripIndent, stripIndents } from "common-tags";
import {
	Routes,
	type APIEmbed,
	type APIEmbedAuthor,
	type Client,
	type Guild,
	type MessageCreateOptions
} from "discord.js";
export const isMessageReport = (
	data: Report
): data is Report & {
	targetMessageChannelId: string;
	targetMessageId: string;
} => Boolean(data.targetMessageChannelId) && Boolean(data.targetMessageId);

export class UserReportModule
	implements
		Omit<ReportWithIncludes, "targetMessageChannelId" | "targetMessageId">
{
	public client!: Client<true>;
	public data!: ReportWithIncludes;
	public guild!: Guild;
	public manager!: ReportManager;

	public anonymous!: boolean;
	public authorUserId!: string;
	public authorUserTag!: string;
	public comment!: string;
	public createdAt!: Date;
	public guildId!: string;
	public guildRelativeId!: number;
	public id!: number;
	public logChannelId!: string | null;
	public logMessageId!: string | null;
	public processedAt!: Date | null;
	public processedByUserId!: string | null;
	public processedByUserTag!: string | null;
	public referencedBy!: Array<CaseWithIncludes>;
	public targetUserId!: string;
	public targetUserTag!: string;
	public type!: ReportType;

	public constructor(manager: ReportManager, data: ReportWithIncludes) {
		this._constructor(manager, data);
	}

	public isMessageReport(): this is MessageReportModule {
		return isMessageReport(this.data);
	}

	public isUserReport(): this is UserReportModule {
		return !this.isMessageReport();
	}

	public async edit(data: Prisma.ReportUpdateInput) {
		const res = await this.manager.editRaw({
			data,
			where: { id: this.id }
		});

		this._constructor(this.manager, res);

		return this;
	}

	public async editLog() {
		if (!this.logChannelId || !this.logMessageId) {
			return false;
		}

		const body = await this.generatePost();

		const fullRoute = Routes.channelMessage(
			this.logChannelId,
			this.logMessageId
		);

		return await this.client.rest
			.patch(fullRoute, { body })
			.then(() => true)
			.catch(() => false);
	}

	public async fetchTarget() {
		const member = await this.guild.members
			.fetch({ user: this.targetUserId, force: true })
			.catch(() => null);

		if (member) {
			return member;
		}

		return await this.client.users
			.fetch(this.targetUserId, { force: true })
			.catch(() => null);
	}

	public authorMentionString() {
		const split = this.authorUserTag.split("#");

		return getTag({
			id: this.authorUserId,
			username: split[0],
			discriminator: split[1]
		});
	}

	public targetMentionString() {
		return getTag({
			id: this.targetUserId,
			tag: this.targetUserTag
		});
	}

	// Message module requires async
	// eslint-disable-next-line @typescript-eslint/require-await
	public async generatePost(): Promise<MessageCreateOptions> {
		return this.generateBasePost();
	}

	protected generateBasePost(
		typeSpecificInformation?: string | null | undefined
	) {
		const rows = components.createRows.specific(2, 3)(
			components.buttons
				.memberInfo(this.targetUserId, "Target")
				.component(),
			components.buttons
				.memberInfo(this.authorUserId, "Author")
				.component(),
			// ---
			components.buttons.attachToLatestCase(this.id),
			this.referencedBy.length
				? components.buttons.unattachReportFromCases(this.id)
				: null,
			// ---
			this.processedAt
				? components.buttons.markReportUnprocessed(this.id)
				: components.buttons.markReportProcessed(this.id)
		);

		const authorMention = this.anonymous
			? "Anonymous user"
			: getTag({ tag: this.authorUserTag, id: this.authorUserId });

		const ifProcessed =
			this.processedAt &&
			this.processedByUserId &&
			this.processedByUserTag
				? stripIndents`
					* At: ${longstamp(this.processedAt, { extraLong: true })}
					* By: ${getTag({ id: this.processedByUserId, tag: this.processedByUserTag })}
				`
				: "";

		const emoji = this.processedAt ? Emojis.Check : Emojis.Cross;
		const content = squash(source`
			# [${emoji}] Report #${this.guildRelativeId}
			### ${this.type} report by ${authorMention}
			* Created ${longstamp(this.createdAt, { extraLong: true })}
			* Report targets user: ${this.targetMentionString()}
			* Processed: ${this.processedAt ? `${Emojis.Check} Yes` : `${Emojis.Cross} No`}
			 ${ifProcessed}
			### Author-provided comment:
			> ${this.comment}

			${typeSpecificInformation ?? ""}
		`).trim();

		return { components: rows, content };
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
		this.authorUserTag = data.authorUserTag;
		this.comment = data.comment;
		this.createdAt = data.createdAt;
		this.guildId = data.guildId;
		this.guildRelativeId = data.guildRelativeId;
		this.id = data.id;
		this.logChannelId = data.logChannelId;
		this.logMessageId = data.logMessageId;
		this.processedAt = data.processedAt;
		this.processedByUserId = data.processedByUserId;
		this.processedByUserTag = data.processedByUserTag;
		this.referencedBy = data.referencedBy;
		this.targetUserId = data.targetUserId;
		this.targetUserTag = data.targetUserTag;
		this.type = data.type;
	}
}

export class MessageReportModule extends UserReportModule {
	public targetMessageChannelId: string;
	public targetMessageId: string;
	public targetMessageURL: string;

	public constructor(
		manager: ReportManager,
		data: ReportWithIncludes & {
			targetMessageId: string;
			targetMessageChannelId: string;
		}
	) {
		super(manager, data);

		this.targetMessageChannelId = data.targetMessageChannelId;
		this.targetMessageId = data.targetMessageId;
		this.targetMessageURL = messageURL(
			data.guildId,
			data.targetMessageChannelId,
			data.targetMessageId
		);
	}

	public async fetchTargetMessage() {
		const channel = this.guild.channels.cache.get(
			this.targetMessageChannelId
		);

		if (!channel?.isTextBased()) {
			return null;
		}

		return channel.messages.fetch(this.targetMessageId).catch(() => null);
	}

	public async toEmbed(): Promise<APIEmbed> {
		const target =
			(await this.guild.members
				.fetch(this.targetUserId)
				.catch(() => null)) ??
			(await this.client.users
				.fetch(this.targetUserId)
				.catch(() => null));

		const fields = target ? getMemberInfo(target, "Target") : [];

		const author: APIEmbedAuthor = this.anonymous
			? { name: "Anonymous user" }
			: { name: `${this.authorUserTag} (${this.authorUserId})` };

		return {
			author,
			color: this.processedAt ? ColorsHex.Green : ColorsHex.Red,
			fields,
			footer: { text: `Report #${this.guildRelativeId}` }
		};
	}

	public async generatePost(): Promise<MessageCreateOptions> {
		const message = await this.fetchTargetMessage();

		if (!message) {
			return this.generateBasePost(
				stripIndent`
					### Message
					* Message author: ${this.targetMentionString()}
					* [Message URL](<${this.targetMessageURL}>)
					${Emojis.Warn} Could not fetch and preview the message.
				`
			);
		}

		const base = this.generateBasePost(
			stripIndent`
				### Message
				* Author: ${this.targetMentionString()}
				* [Message URL](<${this.targetMessageURL}>)
				* Preview:
			`
		);

		const messageEmbed = messageToEmbed(message, { withIds: true });

		const messageButtonRow = components.createRows(
			components.buttons.url({ label: "Go to message", url: message.url })
		);

		return {
			...base,
			components: [...messageButtonRow, ...base.components],
			embeds: [messageEmbed]
		};
	}
}
