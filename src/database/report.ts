import components from "#components";
import {
	isMessageReport,
	MessageReportModule,
	UserReportModule
} from "#modules/Report.js";
import { ReportType, type Prisma, type Report } from "@prisma/client";
import { type Guild, type MessageCreateOptions } from "discord.js";
import prisma from "./prisma.js";

export default class ReportManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.report;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public toModule(data: Report): MessageReportModule | UserReportModule;
	public toModule(
		data: Report | null | undefined
	): MessageReportModule | UserReportModule | null | undefined;
	public toModule(
		data: Report | null | undefined
	): MessageReportModule | UserReportModule | null | undefined {
		if (!data) {
			return null;
		}

		if (isMessageReport(data)) {
			return new MessageReportModule(this, data);
		}

		return new UserReportModule(this, data);
	}

	public async get(reportId: number) {
		const data = await this.prisma.findUnique({ where: { id: reportId } });

		return this.toModule(data);
	}

	public async getAll(options?: {
		targetUserId?: string;
		processedByUserId?: string;
	}) {
		const data = await this.prisma.findMany({
			where: {
				guildId: this.guild.id,
				targetUserId: options?.targetUserId,
				processedByUserId: options?.processedByUserId
			}
		});

		if (!data.length) {
			return null;
		}

		return data.map((data) => this.toModule(data));
	}

	public async getNextGuildRelativeId(): Promise<number> {
		const data = await this.prisma.findFirst({
			where: {
				guildId: this.guild.id
			},
			orderBy: {
				id: "desc"
			},
			select: {
				guildRelativeId: true
			}
		});

		return (data?.guildRelativeId ?? 0) + 1;
	}

	public async createMessageReport(
		data: Omit<Prisma.ReportCreateInput, "type"> & {
			targetMessageId: string;
			targetMessageChannelId: string;
		}
	) {
		return await this.create({ ...data, type: ReportType.Message });
	}

	public async createUserReport(
		data: Omit<
			Prisma.ReportCreateInput,
			"targetMessageChannelId" | "targetMessageId" | "type"
		>
	) {
		return await this.create({ ...data, type: ReportType.User });
	}

	public async preparePost(
		module: MessageReportModule | UserReportModule
	): Promise<MessageCreateOptions> {
		const rows = components.createRows(
			components.buttons.attachToLatestCase,
			components.buttons.markComplete
		);

		return {
			components: rows,
			embeds: [await module.toEmbed()]
		};
	}

	private async create(data: Prisma.ReportCreateInput) {
		const data_ = await this.prisma.create({ data });

		return this.toModule(data_);
	}
}
