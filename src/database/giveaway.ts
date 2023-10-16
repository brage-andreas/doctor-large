import { type Giveaway, type Prisma, type Prize, type Winner } from "@prisma/client";
import { type GiveawayWithIncludes } from "#typings";
import { type Client, type Guild } from "discord.js";
import GiveawayModule from "#modules/giveaway.js";
import PrizeModule from "#modules/prize.js";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly client: Client;
	public readonly guild: Guild;
	public readonly prisma = prisma;

	public constructor(guild: Guild) {
		this.client = guild.client;
		this.guild = guild;
	}

	public async create(data: Prisma.GiveawayCreateInput): Promise<GiveawayModule> {
		const data_ = await this.prisma.giveaway.create({
			data,
			include: {
				prizes: {
					include: {
						winners: true,
					},
				},
			},
		});

		return new GiveawayModule(data_, this.guild);
	}

	// Prisma.PrizeCreateInput is weird and i dont know why
	public async createPrize(data: Prisma.PrizeCreateArgs["data"]) {
		const data_ = await this.prisma.prize.create({
			data,
			include: {
				giveaway: {
					include: {
						prizes: {
							include: {
								winners: true,
							},
						},
					},
				},
			},
		});

		const giveaway = new GiveawayModule(data_.giveaway, this.guild);

		return new PrizeModule({ ...data_, giveaway, winners: [] }, this.guild);
	}

	public async createWinners(...arguments_: Array<Prisma.WinnerCreateManyInput>) {
		return await this.prisma.winner.createMany({
			data: arguments_,
		});
	}

	public async delete(...giveawayIds: Array<number>) {
		return await this.prisma.giveaway.deleteMany({
			where: {
				id: {
					in: giveawayIds,
				},
			},
		});
	}

	public async deletePrize(prizeOrPrizeId: Prize | number) {
		const id = typeof prizeOrPrizeId === "number" ? prizeOrPrizeId : prizeOrPrizeId.id;

		await this.prisma.prize.delete({
			where: {
				id,
			},
		});
	}

	public async deletePrizes(prizeIds: Array<number> | GiveawayModule | GiveawayWithIncludes) {
		const ids = Array.isArray(prizeIds) ? prizeIds : prizeIds.prizes.map((prize) => prize.id);

		await this.prisma.prize.deleteMany({
			where: {
				id: {
					in: ids,
				},
			},
		});
	}

	public async deleteWinners(
		prizeIds: Array<number> | GiveawayModule | GiveawayWithIncludes,
		options?: {
			onlyDeleteUnclaimed?: boolean;
		}
	) {
		const ids = Array.isArray(prizeIds) ? prizeIds : prizeIds.prizes.map((prize) => prize.id);

		return await this.prisma.winner.deleteMany({
			where: {
				claimed: options?.onlyDeleteUnclaimed ? true : undefined,
				prizeId: {
					in: ids,
				},
			},
		});
	}

	public async edit(arguments_: Exclude<Prisma.GiveawayUpdateArgs, "select" | "where">): Promise<GiveawayModule> {
		const data = await this.prisma.giveaway.update({
			...arguments_,
			include: {
				prizes: {
					include: {
						winners: true,
					},
				},
			},
		});

		return new GiveawayModule(data, this.guild);
	}

	public async editPrize(arguments_: Prisma.PrizeUpdateArgs) {
		const data = await this.prisma.prize.update({
			...arguments_,
			include: {
				giveaway: {
					include: {
						prizes: {
							include: {
								winners: true,
							},
						},
					},
				},
				winners: true,
			},
		});

		const giveaway = new GiveawayModule(data.giveaway, this.guild);

		return new PrizeModule({ ...data, giveaway }, this.guild);
	}

	public async editWinner(arguments_: Prisma.WinnerUpdateArgs) {
		return await this.prisma.winner.update(arguments_);
	}

	public async get(id: number): Promise<GiveawayModule | null> {
		const data = await this.prisma.giveaway.findUnique({
			include: {
				prizes: {
					include: {
						winners: true,
					},
				},
			},
			where: {
				id,
			},
		});

		if (!data) {
			return null;
		}

		return new GiveawayModule(data, this.guild);
	}

	public async getAll(filter?: {
		entryUserId?: string;
		hostUserId?: string;
		winnerUserId?: string;
	}): Promise<Array<GiveawayModule>> {
		const entry = filter?.entryUserId;
		const winner = filter?.winnerUserId;
		const host = filter?.hostUserId;

		const data = await this.prisma.giveaway.findMany({
			include: {
				prizes: {
					include: {
						winners: true,
					},
				},
			},
			orderBy: {
				id: "desc",
			},
			where: {
				entriesUserIds: entry ? { has: entry } : undefined,
				guildId: this.guild.id,
				hostUserId: host,
				prizes: winner ? { some: { winners: { some: { userId: winner } } } } : undefined,
			},
		});

		return data.map((data) => new GiveawayModule(data, this.guild));
	}

	public async getCountInGuild(): Promise<number> {
		return await this.prisma.giveaway.count({
			where: {
				guildId: this.guild.id,
			},
		});
	}

	public async getNextGuildRelativeId(): Promise<number> {
		const data = await this.prisma.giveaway.findFirst({
			orderBy: {
				id: "desc",
			},
			select: {
				guildRelativeId: true,
			},
			where: {
				guildId: this.guild.id,
			},
		});

		return (data?.guildRelativeId ?? 0) + 1;
	}

	public async getPrize(prizeId: number): Promise<PrizeModule | null> {
		const data = await this.prisma.prize.findFirst({
			include: {
				giveaway: {
					include: {
						prizes: {
							include: {
								winners: true,
							},
						},
					},
				},
				winners: true,
			},
			where: {
				id: prizeId,
			},
		});

		if (!data) {
			return null;
		}

		const giveaway = new GiveawayModule(data.giveaway, this.guild);

		return new PrizeModule({ ...data, giveaway }, this.guild);
	}

	public async getPrizes(filter?: {
		claimed?: boolean;
		giveawayId?: number;
		winnerUserId?: string;
	}): Promise<Array<PrizeModule>> {
		const id = filter?.giveawayId;
		const userId = filter?.winnerUserId;
		const claimed = filter?.claimed;

		const data = await this.prisma.prize.findMany({
			include: {
				giveaway: {
					include: {
						prizes: {
							include: {
								winners: true,
							},
						},
					},
				},
				winners: true,
			},
			orderBy: {
				id: "desc",
			},
			where: {
				giveawayId: id,
				winners: userId ?? claimed ? { some: { claimed, userId } } : undefined,
			},
		});

		return data.map((data) => {
			const giveaway = new GiveawayModule(data.giveaway, this.guild);

			return new PrizeModule({ ...data, giveaway }, this.guild);
		});
	}

	public async getWithOffset(skip: number, take: number): Promise<Array<Giveaway>> {
		return await this.prisma.giveaway.findMany({
			orderBy: {
				id: "asc",
			},
			skip,
			take,
			where: {
				guildId: this.guild.id,
			},
		});
	}

	public async setWinnerClaimed(options: {
		claimed: boolean;
		prizeId: number;
		userId: string;
	}): Promise<Prisma.BatchPayload>;
	public async setWinnerClaimed(options: { claimed: boolean; winnerId: number }): Promise<Winner>;
	public async setWinnerClaimed(options: {
		claimed: boolean;
		prizeId?: number;
		userId?: string;
		winnerId?: number;
	}): Promise<Prisma.BatchPayload | Winner> {
		const { claimed, prizeId, userId, winnerId: id } = options;

		if (userId) {
			return await this.prisma.winner.updateMany({
				data: {
					claimed,
				},
				where: {
					prizeId,
					userId,
				},
			});
		}

		return await this.prisma.winner.update({
			data: {
				claimed,
			},
			where: {
				id,
			},
		});
	}
}
