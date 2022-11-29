import { Prisma } from "@prisma/client";
import prisma from "./prisma.js";

type PrismaAutoroleCreateType =
	| (Prisma.Without<
			Prisma.autoroleCreateInput,
			Prisma.autoroleUncheckedCreateInput
	  > &
			Prisma.autoroleUncheckedCreateInput)
	| (Prisma.Without<
			Prisma.autoroleUncheckedCreateInput,
			Prisma.autoroleCreateInput
	  > &
			Prisma.autoroleCreateInput);

export default class AutoroleManager {
	public readonly guildId: string;
	private prisma = prisma.autorole;

	constructor(guildId: string) {
		this.guildId = guildId;

		// Creates entry if it does not exist
		// Not awaited, so it is still possible to get "null" from get()
		this.prisma.findUnique({ where: { guildId } }).then((data) => {
			if (data !== null) {
				return;
			}

			this.prisma.create({ data: { guildId } });
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
