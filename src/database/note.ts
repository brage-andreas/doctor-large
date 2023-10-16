import { type NoteWithIncludes } from "#typings";
import { NoteModule } from "#modules/note.js";
import { type Prisma } from "@prisma/client";
import { type Guild } from "discord.js";
import prisma from "./prisma.js";

export default class NoteManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.note;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public async delete(noteId: number) {
		return await this.prisma
			.delete({
				where: { id: noteId },
			})
			.then(() => true)
			.catch(() => false);
	}

	public async edit(arguments_: Prisma.NoteUpdateArgs) {
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

		return this.toModule(data_);
	}

	public async get(noteId: number) {
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
			where: { id: noteId },
		});

		return this.toModule(data);
	}

	public async getAll(options?: { authorUserId?: string; caseId?: number; targetUserId?: string }) {
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
				authorUserId: options?.authorUserId,
				guildId: this.guild.id,
				referencedBy: options?.caseId ? { some: { id: options.caseId } } : undefined,
				targetUserId: options?.targetUserId,
			},
		});

		if (data.length === 0) {
			return null;
		}

		return data.map((data) => this.toModule(data));
	}

	public toModule(data: NoteWithIncludes | null | undefined): NoteModule | null | undefined {
		if (!data) {
			return null;
		}

		return new NoteModule(this, data);
	}
}
