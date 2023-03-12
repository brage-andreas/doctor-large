import ConfigModule from "#modules/Config.js";
import type { Prisma } from "@prisma/client";
import { type Guild, type GuildBasedChannel } from "discord.js";
import prisma from "./prisma.js";

export default class ConfigManager {
	public readonly guild: Guild;
	public readonly prisma = prisma.config;
	public validated = false;

	public constructor(guild: Guild) {
		this.guild = guild;
	}

	public static async isProtectedChannel(
		guildId: string,
		data: {
			channel?: GuildBasedChannel;
			channelId?: string;
			parentId?: string | null;
			parentParentId?: string | null;
		}
	): Promise<boolean> {
		const rawIds: Array<string | null | undefined> = [];

		if (data.channel) {
			rawIds.push(
				data.channel.id,
				data.channel.parentId,
				data.channel.parent?.parentId
			);
		} else {
			rawIds.push(data.channelId, data.parentId, data.parentParentId);
		}

		const ids = rawIds.filter((e) => Boolean(e)) as Array<string>;

		if (!ids.length) {
			return false;
		}

		const res = await prisma.config.count({
			where: {
				guildId,
				protectedChannelsIds: {
					hasSome: ids
				}
			}
		});

		return Boolean(res);
	}

	public async validate(): Promise<void> {
		const exists = await this.prisma.count({
			where: { guildId: this.guild.id }
		});

		this.validated = true;

		return new Promise((resolve, reject) =>
			exists ? resolve() : reject()
		);
	}

	public async create(): Promise<ConfigModule> {
		if (!this.validated) {
			throw new Error("ConfigManager must be validated before used");
		}

		const data = await this.prisma.create({
			data: { guildId: this.guild.id }
		});

		return new ConfigModule(data, this);
	}

	public async get(): Promise<ConfigModule> {
		if (!this.validated) {
			throw new Error("ConfigManager must be validated before used");
		}

		const data = await this.prisma.findUniqueOrThrow({
			where: { guildId: this.guild.id }
		});

		return new ConfigModule(data, this);
	}

	public async update(
		data: Omit<Prisma.ConfigUpdateInput, "createdAt" | "guildId">
	): Promise<ConfigModule> {
		if (!this.validated) {
			throw new Error("ConfigManager must be validated before used");
		}

		const res = await this.prisma.update({
			where: { guildId: this.guild.id },
			data
		});

		return new ConfigModule(res, this);
	}
}
