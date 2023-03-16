import type ReportManager from "#database/report.js";
import { type Report, type ReportType } from "@prisma/client";
import { type Client, type Guild } from "discord.js";

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

	public id: number;
	public guildId: string;
	public guildRelativeId: number;
	public createdAt: Date;
	public type: ReportType;
	public anonymous: boolean;
	public authorUserId: string;
	public authorUserTag: string;
	public comment: string;
	public targetUserId: string;
	public targetUserTag: string;
	public processed: boolean;
	public processedAt: Date | null;
	public processedByUserId: string | null;
	public processedByUserTag: string | null;

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

		this.id = data.id;
		this.guildId = data.guildId;
		this.guildRelativeId = data.guildRelativeId;
		this.createdAt = data.createdAt;
		this.type = data.type;
		this.anonymous = data.anonymous;
		this.authorUserId = data.authorUserId;
		this.authorUserTag = data.authorUserTag;
		this.comment = data.comment;
		this.processed = data.processed;
		this.processedAt = data.processedAt;
		this.processedByUserId = data.processedByUserId;
		this.processedByUserTag = data.processedByUserTag;
		this.targetUserId = data.targetUserId;
		this.targetUserTag = data.targetUserTag;
	}

	public isMessageReport(): this is MessageReportModule {
		return isMessageReport(this.data);
	}

	public isUserReport(): this is UserReportModule {
		return !this.isMessageReport();
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
