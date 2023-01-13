import type { Prisma } from "@prisma/client";
import { type Guild } from "discord.js";
import Autorole from "../modules/Autorole.js";
import prisma from "./prisma.js";

export default class AutoroleManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.autoroleData;
	private initialized = false;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public async initialize() {
		// guildId is primary key, so `count` will only be 0 or 1
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

		return new Autorole(data, this.guild, this);
	}

	public async update(
		data: Omit<Prisma.AutoroleDataUpdateInput, "guildId" | "lastEditedAt">
	) {
		if (!this.initialized) {
			throw new Error("Autorole manager has not been initialized.");
		}

		const data_ = await this.prisma.update({
			where: { guildId: this.guild.id },
			data
		});

		return new Autorole(data_, this.guild, this);
	}
}
