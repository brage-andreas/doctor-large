import components from "#components";
import { messageToEmbed } from "#helpers/messageHelpers.js";
import {
	isMessageReport,
	MessageReportModule,
	UserReportModule
} from "#modules/Report.js";
import { ReportType, type Prisma, type Report } from "@prisma/client";
import { oneLine, stripIndent } from "common-tags";
import {
	blockQuote,
	bold,
	inlineCode,
	userMention,
	type APIButtonComponent,
	type APIEmbed,
	type Guild,
	type MessageCreateOptions
} from "discord.js";
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
		const data_ = await this.prisma.update({ ...args });

		return this.toModule(data_);
	}

	public async createMessageReport<
		T extends MessageReportModule | UserReportModule
	>(
		data: Omit<Prisma.ReportCreateInput, "type"> & {
			targetMessageId: string;
			targetMessageChannelId: string;
		}
	) {
		return await this.create<T>({ ...data, type: ReportType.Message });
	}

	public async createUserReport<
		T extends MessageReportModule | UserReportModule
	>(
		data: Omit<
			Prisma.ReportCreateInput,
			"targetMessageChannelId" | "targetMessageId" | "type"
		>
	) {
		return await this.create<T>({ ...data, type: ReportType.User });
	}

	public async preparePost(
		report: MessageReportModule | UserReportModule
	): Promise<MessageCreateOptions> {
		const buttons: Array<APIButtonComponent> = [
			components.buttons.attachToLatestCase.component(),
			components.buttons.markComplete.component()
		];

		const authorShortMention = report.anonymous
			? "anonymous user"
			: userMention(report.authorUserId);

		const authorFullMention = report.anonymous
			? "Anonymous user"
			: oneLine`
				${userMention(report.authorUserId)} -
				${inlineCode(report.authorUserTag)}
				(${report.authorUserId})
			`;

		const embeds: Array<APIEmbed> = [];
		let content: string;

		if (report.isMessageReport()) {
			const urlButton = components.buttons.url({
				label: "Go to message",
				url: report.targetMessageURL
			});

			buttons.push(urlButton.component());

			const msg = await report.fetchTargetMessage();

			if (msg) {
				embeds.push(messageToEmbed(msg));
			}

			content = stripIndent`
				${bold(`Report #${report.guildRelativeId}`)} by ${authorShortMention}
				  → Type: Message report
				  → Target: Message by ${report.targetMentionString()}
				  → Author: ${authorFullMention}

				Comment:
				${blockQuote(report.comment)}
			`;
		} else {
			content = stripIndent`
				${bold(`Report #${report.guildRelativeId}`)} by ${authorShortMention}
				  → Type: User report
				  → Target: ${report.targetMentionString()}

				Comment:
				${blockQuote(report.comment)}
			`;
		}

		embeds.push(await report.toEmbed());

		return {
			components: components.createRows(...buttons),
			content,
			embeds
		};
	}

	private async create<T extends MessageReportModule | UserReportModule>(
		data: Prisma.ReportCreateInput
	): Promise<T> {
		const data_ = await this.prisma.create({ data });

		return this.toModule(data_) as T;
	}
}
