import AutoroleModule from "#modules/Autorole.js";
import { type Prisma } from "@prisma/client";
import { type Guild } from "discord.js";
import prisma from "./prisma.js";

export default class AutoroleManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.autorole;
	private initialized = false;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public async initialize() {
		const count = await this.prisma.count({
			where: { guildId: this.guild.id }
		});

		if (count === 0) {
			await this.prisma.create({ data: { guildId: this.guild.id } });
		}

		this.initialized = true;
	}

	public async get() {
		if (!this.initialized) {
			throw new Error("Autorole manager has not been initialized.");
		}

		const data = await this.prisma.findUniqueOrThrow({
			where: { guildId: this.guild.id }
		});

		return new AutoroleModule(data, this.guild, this);
	}

	public async update(
		data: Omit<Prisma.AutoroleUpdateInput, "guildId" | "lastEditedAt">
	) {
		if (!this.initialized) {
			throw new Error("Autorole manager has not been initialized.");
		}

		const data_ = await this.prisma.update({
			where: { guildId: this.guild.id },
			data
		});

		return new AutoroleModule(data_, this.guild, this);
	}
}
