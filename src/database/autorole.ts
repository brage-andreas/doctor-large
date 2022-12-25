import type { Prisma } from "@prisma/client";
import prisma from "./prisma.js";

export default class AutoroleManager {
	public readonly guildId: string;
	private readonly prisma = prisma.autorole;
	private initialized = false;

	public constructor(guildId: string) {
		this.guildId = guildId;
	}

	public async initialize() {
		// guildId is primary key, so `count` will only be 0 or 1
		const count = await this.prisma.count({
			where: { guildId: this.guildId }
		});

		if (count === 0) {
			await this.prisma.create({ data: { guildId: this.guildId } });
		}

		this.initialized = true;
	}

	public async get() {
		if (!this.initialized) {
			throw new Error("Autorole manager has not been initialized.");
		}

		return await this.prisma.findUniqueOrThrow({
			where: {
				guildId: this.guildId
			}
		});
	}

	public async update(data: Prisma.AutoroleUpdateInput) {
		if (!this.initialized) {
			throw new Error("Autorole manager has not been initialized.");
		}

		return await this.prisma.update({
			where: {
				guildId: this.guildId
			},
			data
		});
	}
}
