import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { type CaseType, type Prisma } from "@prisma/client";
import { type Guild } from "discord.js";
import prisma from "./prisma.js";

export default class CaseManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.case;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public toModule(data: CaseWithIncludes | null | undefined) {
		if (!data) {
			return null;
		}

		return new CaseModule(this, data);
	}

	public async get(noteId: number) {
		const data = await this.prisma.findUnique({
			where: { id: noteId },
			include: {
				referencedBy: true,
				note: true,
				reference: true,
				report: true
			}
		});

		return this.toModule(data);
	}

	public async getAll(options?: {
		moderatorUserId?: string;
		noteId?: number;
		processed?: boolean;
		reportId?: number;
		targetId?: string;
		temporary?: boolean;
		type?: Array<CaseType>;
	}) {
		const data = await this.prisma.findMany({
			where: {
				guildId: this.guild.id,
				moderatorUserId: options?.moderatorUserId,
				noteId: options?.noteId,
				processed: options?.processed,
				reportId: options?.reportId,
				targetIds: options?.targetId
					? { has: options.targetId }
					: undefined,
				temporary: options?.temporary,
				type: options?.type ? { in: options.type } : undefined
			},
			include: {
				referencedBy: true,
				note: true,
				reference: true,
				report: true
			}
		});

		if (!data.length) {
			return null;
		}

		return data.map((data) => this.toModule(data));
	}

	public async edit(args: Prisma.CaseUpdateArgs) {
		const data_ = await this.prisma.update({
			...args,
			include: {
				referencedBy: true,
				note: true,
				reference: true,
				report: true
			}
		});

		return this.toModule(data_);
	}

	public async delete(noteId: number) {
		return await this.prisma
			.delete({
				where: { id: noteId }
			})
			.then(() => true)
			.catch(() => false);
	}
}
