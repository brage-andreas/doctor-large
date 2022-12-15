import type { Prisma } from "@prisma/client";
import prisma from "./prisma.js";

export default class AutoroleManager {
	public readonly guildId: string;
	private readonly prisma = prisma.autorole;

	public constructor(guildId: string) {
		this.guildId = guildId;

		// Creates entry if it does not exist
		// Not awaited, so it is still possible to get "null" from get()
		this.prisma.findUnique({ where: { guildId } }).then((data) => {
			if (data !== null) {
				return;
			}

			// For some reason it does not work without a .then()
			this.prisma.create({ data: { guildId } }).then(() => null);
		});
	}

	public async get() {
		const data = await this.prisma.findUnique({
			where: {
				guildId: this.guildId
			}
		});

		if (data) {
			return data;
		}

		return await this.prisma.create({
			data: { guildId: this.guildId }
		});
	}

	public async update(data: Prisma.autoroleUpdateInput) {
		return await this.prisma.update({
			data,
			where: {
				guildId: this.guildId
			}
		});
	}
}
