import { NoteModule } from "#modules/Note.js";
import { type NoteWithIncludes } from "#typings";
import { type Prisma } from "@prisma/client";
import { type Guild } from "discord.js";
import prisma from "./prisma.js";

export default class NoteManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.note;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public toModule(
		data: NoteWithIncludes | null | undefined
	): NoteModule | null | undefined {
		if (!data) {
			return null;
		}

		return new NoteModule(this, data);
	}

	public async get(noteId: number) {
		const data = await this.prisma.findUnique({
			where: { id: noteId },
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
		authorUserId?: string;
		targetUserId?: string;
		caseId?: number;
	}) {
		const data = await this.prisma.findMany({
			where: {
				guildId: this.guild.id,
				authorUserId: options?.authorUserId,
				targetUserId: options?.targetUserId,
				referencedBy: options?.caseId
					? { some: { id: options.caseId } }
					: undefined
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

	public async edit(args: Prisma.NoteUpdateArgs) {
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

	public async delete(noteId: number) {
		return await this.prisma
			.delete({
				where: { id: noteId }
			})
			.then(() => true)
			.catch(() => false);
	}
}
