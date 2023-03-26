import { ColorsHex } from "#constants";
import type ReportManager from "#database/report.js";
import getMemberInfo from "#helpers/memberInfo.js";
import { longstamp } from "#helpers/timestamps.js";
import { type Report, type ReportType } from "@prisma/client";
import { stripIndents } from "common-tags";
import {
	SnowflakeUtil,
	userMention,
	type APIEmbed,
	type Client,
	type Guild
} from "discord.js";

export const isMessageReport = (
	data: Report
): data is Report & {
	targetMessageChannelId: string;
	targetMessageId: string;
} => "targetMessageChannelId" in data && "targetMessageId" in data;

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
			throw new Error(
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

	public toEmbedSync(): APIEmbed {
		const id = this.targetUserId;
		const tag = this.targetUserTag;

		return {
			author: { name: `${this.authorUserTag} (${this.authorUserId})` },
			color: this.processedAt ? ColorsHex.Green : ColorsHex.Red,
			description: this.comment,
			fields: [
				{
					inline: false,
					name: "Target user info",
					value: stripIndents`
						Name: ${userMention(id)} - \`${tag}\` (${id})
						Created: ${longstamp(SnowflakeUtil.timestampFrom(id))}
					`
				}
			],
			footer: { text: `Report #${this.guildRelativeId}` }
		};
	}

	public async toEmbed(): Promise<APIEmbed> {
		const target = await this.client.users
			.fetch(this.targetUserId)
			.catch(() => null);

		const fields = target ? getMemberInfo(target, "Target") : [];

		return {
			author: { name: `${this.authorUserTag} (${this.authorUserId})` },
			color: this.processedAt ? ColorsHex.Green : ColorsHex.Red,
			description: this.comment,
			fields,
			footer: { text: `Report #${this.guildRelativeId}` }
		};
	}
}

export class MessageReportModule extends UserReportModule {
	public targetMessageChannelId: string;
	public targetMessageId: string;

	public constructor(
		manager: ReportManager,
		data: Report & {
			targetMessageId: string;
			targetMessageChannelId: string;
		}
	) {
		super(manager, data);

		this.targetMessageId = data.targetMessageId;
		this.targetMessageChannelId = data.targetMessageChannelId;
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
}