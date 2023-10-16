import { MessageReportModule, UserReportModule, isMessageReport } from "#modules/report.js";
import { type Guild, type MessageCreateOptions } from "discord.js";
import { type Prisma, ReportType } from "@prisma/client";
import { type ReportWithIncludes } from "#typings";
import prisma from "./prisma.js";

export default class ReportManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.report;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	private async create<T extends MessageReportModule | UserReportModule>(data: Prisma.ReportCreateInput): Promise<T> {
		const data_ = await this.prisma.create({
			data,
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true,
					},
				},
			},
		});

		return this.toModule(data_) as T;
	}
	public async createMessageReport(
		data: Omit<Prisma.ReportCreateInput, "type"> & {
			targetMessageChannelId: string;
			targetMessageId: string;
		}
	) {
		return await this.create<MessageReportModule>({
			...data,
			type: ReportType.Message,
		});
	}
	public async createUserReport(
		data: Omit<Prisma.ReportCreateInput, "targetMessageChannelId" | "targetMessageId" | "type">
	) {
		return await this.create<UserReportModule>({
			...data,
			type: ReportType.User,
		});
	}

	public async edit(arguments_: Prisma.ReportUpdateArgs) {
		const data_ = await this.editRaw(arguments_);

		return this.toModule(data_);
	}

	public async editRaw(arguments_: Prisma.ReportUpdateArgs) {
		const data_ = await this.prisma.update({
			...arguments_,
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true,
					},
				},
			},
		});

		return data_;
	}

	public async generatePost(report: MessageReportModule | UserReportModule): Promise<MessageCreateOptions> {
		return await report.generatePost();
	}

	public async get(reportId: number) {
		const data = await this.prisma.findUnique({
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true,
					},
				},
			},
			where: { id: reportId },
		});

		return this.toModule(data);
	}

	public async getAll(options?: { processedByUserId?: string; targetUserId?: string }) {
		const data = await this.prisma.findMany({
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true,
					},
				},
			},
			where: {
				guildId: this.guild.id,
				processedByUserId: options?.processedByUserId,
				targetUserId: options?.targetUserId,
			},
		});

		if (data.length === 0) {
			return null;
		}

		return data.map((data) => this.toModule(data));
	}

	public async getNextGuildRelativeId(): Promise<number> {
		const data = await this.prisma.findFirst({
			orderBy: {
				id: "desc",
			},
			select: {
				guildRelativeId: true,
			},
			where: {
				guildId: this.guild.id,
			},
		});

		return (data?.guildRelativeId ?? 0) + 1;
	}

	public async hasRecentReport({
		targetMessageId,
		targetUserId,
	}: {
		targetMessageId?: string;
		targetUserId?: string;
	}): Promise<boolean> {
		if (!targetMessageId && !targetUserId) {
			return false;
		}

		const THIRTY_MINUTES = 1_800_000;
		const thirtyMinutesAgo = new Date(Date.now() - THIRTY_MINUTES);

		const response = await this.prisma.findFirst({
			select: {
				type: true,
			},
			where: {
				createdAt: {
					gte: thirtyMinutesAgo,
				},
				targetMessageId,
				targetUserId,
			},
		});

		return Boolean(response);
	}

	public toModule(data: ReportWithIncludes): MessageReportModule | UserReportModule;

	public toModule(
		data: ReportWithIncludes | null | undefined
	): MessageReportModule | UserReportModule | null | undefined;

	public toModule(
		data: ReportWithIncludes | null | undefined
	): MessageReportModule | UserReportModule | null | undefined {
		if (!data) {
			return null;
		}

		if (isMessageReport(data)) {
			return new MessageReportModule(this, data);
		}

		return new UserReportModule(this, data);
	}
}
