import type { Prisma } from "@prisma/client";
import prisma from "./prisma.js";

type PrismaAutoroleCreateType =
	| (Prisma.autoroleCreateInput &
			Prisma.Without<
				Prisma.autoroleUncheckedCreateInput,
				Prisma.autoroleCreateInput
			>)
	| (Prisma.autoroleUncheckedCreateInput &
			Prisma.Without<
				Prisma.autoroleCreateInput,
				Prisma.autoroleUncheckedCreateInput
			>);

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
		return await this.prisma.findUnique({
			where: {
				guildId: this.guildId
			}
		});
	}

	public async set(data: PrismaAutoroleCreateType) {
		return await this.prisma.upsert({
			create: data,
			update: data,
			where: {
				guildId: this.guildId
			}
		});
	}
}
