import components from "#components";
import { ColorsHex, Emojis } from "#constants";
import type ReportManager from "#database/report.js";
import getMemberInfo from "#helpers/memberInfo.js";
import { messageToEmbed, messageURL } from "#helpers/messageHelpers.js";
import squash from "#helpers/squash.js";
import { longstamp } from "#helpers/timestamps.js";
import { type Report, type ReportType } from "@prisma/client";
import { source, stripIndent, stripIndents } from "common-tags";
import {
	bold,
	inlineCode,
	quote,
	userMention,
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
	implements Omit<Report, "targetMessageChannelId" | "targetMessageId">
{
	public client: Client<true>;
	public data: Report;
	public guild: Guild;
	public manager: ReportManager;

	public anonymous: boolean;
	public authorUserId: string;
	public authorUserTag: string;
	public comment: string;
	public createdAt: Date;
	public guildId: string;
	public guildRelativeId: number;
	public id: number;
	public logChannelId: string | null;
	public logMessageId: string | null;
	public processedAt: Date | null;
	public processedByUserId: string | null;
	public processedByUserTag: string | null;
	public targetUserId: string;
	public targetUserTag: string;
	public type: ReportType;

	public constructor(manager: ReportManager, data: Report) {
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
		this.targetUserId = data.targetUserId;
		this.targetUserTag = data.targetUserTag;
		this.type = data.type;
	}

	public isMessageReport(): this is MessageReportModule {
		return isMessageReport(this.data);
	}

	public isUserReport(): this is UserReportModule {
		return !this.isMessageReport();
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
		return this.userMentionString(this.authorUserId, this.authorUserTag);
	}

	public targetMentionString() {
		return this.userMentionString(this.targetUserId, this.targetUserTag);
	}

	public async preparePost() {
		return this.manager.preparePost(this);
	}

	// Message module requires async
	// eslint-disable-next-line @typescript-eslint/require-await
	public async generatePost(): Promise<MessageCreateOptions> {
		return this.generateBasePost();
	}

	protected userMentionString(id: string, tag: string) {
		return `${userMention(id)} - ${inlineCode(tag)} (${id})` as const;
	}

	protected generateBasePost(
		typeSpecificInformation?: string | null | undefined
	) {
		const rows = components.createRows.uniform(2)(
			components.buttons
				.memberInfo(this.targetUserId)
				.component("Target"),
			components.buttons
				.memberInfo(this.authorUserId)
				.component("Author"),
			// ---
			components.buttons.attachToLatestCase,
			components.buttons.markComplete
		);

		const authorMention = this.anonymous
			? "Anonymous user"
			: this.authorMentionString();

		const ifProcessed =
			this.processedAt &&
			this.processedByUserId &&
			this.processedByUserTag
				? stripIndents`
					- At: ${longstamp(this.processedAt, { extraLong: true })}
					- By: ${this.userMentionString(this.processedByUserId, this.processedByUserTag)}
				`
				: "";

		const content = squash(source`
			${this.processedAt ? `(${Emojis.Check} Processed) ` : ""}${bold(
			`Report #${this.guildRelativeId}`
		)}
			${this.type} report by ${authorMention}.
			${quote(this.comment)}

			${bold("Info")}
			  → Created ${longstamp(this.createdAt, { extraLong: true })}
			  → Target user: ${this.targetMentionString()}
			  → Processed: ${
					this.processedAt
						? `${Emojis.Check} Yes`
						: `${Emojis.Cross} No`
				}
			      ${ifProcessed}

			${typeSpecificInformation ?? ""}
		`).trim();

		return { components: rows, content };
	}
}

export class MessageReportModule extends UserReportModule {
	public targetMessageChannelId: string;
	public targetMessageId: string;
	public targetMessageURL: string;

	public constructor(
		manager: ReportManager,
		data: Report & {
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
					${bold("Message")}
					→ Message author: ${this.targetMentionString()}
					→ URL: ${this.targetMessageURL}
				`
			);
		}

		const base = this.generateBasePost(
			stripIndent`
				${bold("Message")}
				→ Message author: ${this.targetMentionString()}
				→ URL: ${this.targetMessageURL}

				Message preview:
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
