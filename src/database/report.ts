import {
	isMessageReport,
	MessageReportModule,
	UserReportModule
} from "#modules/Report.js";
import { type ReportWithIncludes } from "#typings";
import { ReportType, type Prisma } from "@prisma/client";
import { type Guild, type MessageCreateOptions } from "discord.js";
import prisma from "./prisma.js";

export default class ReportManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.report;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public toModule(
		data: ReportWithIncludes
	): MessageReportModule | UserReportModule;
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

	public async get(reportId: number) {
		const data = await this.prisma.findUnique({
			where: { id: reportId },
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true
					}
				}
			}
		});

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
			},
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true
					}
				}
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

	public async hasRecentReport({
		targetMessageId,
		targetUserId
	}: {
		targetMessageId?: string;
		targetUserId?: string;
	}): Promise<boolean> {
		if (!targetMessageId && !targetUserId) {
			return false;
		}

		const THIRTY_MINUTES = 1_800_000;
		const thirtyMinutesAgo = new Date(Date.now() - THIRTY_MINUTES);

		const res = await this.prisma.findFirst({
			where: {
				createdAt: {
					gte: thirtyMinutesAgo
				},
				targetMessageId,
				targetUserId
			},
			select: {
				type: true
			}
		});

		return Boolean(res);
	}

	public async edit(args: Prisma.ReportUpdateArgs) {
		const data_ = await this.prisma.update({
			...args,
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true
					}
				}
			}
		});

		return this.toModule(data_);
	}

	public async createMessageReport(
		data: Omit<Prisma.ReportCreateInput, "type"> & {
			targetMessageId: string;
			targetMessageChannelId: string;
		}
	) {
		return await this.create<MessageReportModule>({
			...data,
			type: ReportType.Message
		});
	}

	public async createUserReport(
		data: Omit<
			Prisma.ReportCreateInput,
			"targetMessageChannelId" | "targetMessageId" | "type"
		>
	) {
		return await this.create<UserReportModule>({
			...data,
			type: ReportType.User
		});
	}

	public async generatePost(
		report: MessageReportModule | UserReportModule
	): Promise<MessageCreateOptions> {
		return await report.generatePost();
	}

	private async create<T extends MessageReportModule | UserReportModule>(
		data: Prisma.ReportCreateInput
	): Promise<T> {
		const data_ = await this.prisma.create({
			data,
			include: {
				referencedBy: {
					include: {
						note: true,
						reference: true,
						referencedBy: true,
						report: true
					}
				}
			}
		});

		return this.toModule(data_) as T;
	}
}
