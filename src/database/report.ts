import {
	isMessageReport,
	MessageReportModule,
	UserReportModule
} from "#modules/Report.js";
import { type Prisma, type Report } from "@prisma/client";
import { type Guild } from "discord.js";
import prisma from "./prisma.js";

export default class ReportManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.report;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public toModule(data: Report | null | undefined) {
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

	public async create(data: Prisma.ReportCreateInput) {
		const data_ = await this.prisma.create({ data });

		return this.toModule(data_);
	}
}
