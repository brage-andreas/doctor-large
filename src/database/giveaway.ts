import {
	type Giveaway,
	type Prisma,
	type Prize,
	type Winner
} from "@prisma/client";
import { type Client, type Guild } from "discord.js";
import GiveawayModule from "../modules/Giveaway.js";
import PrizeModule from "../modules/Prize.js";
import { type GiveawayWithIncludes } from "../typings/database.js";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly prisma = prisma;
	public readonly client: Client;
	public readonly guild: Guild;

	public constructor(guild: Guild) {
		this.client = guild.client;
		this.guild = guild;
	}

	public async get(id: number): Promise<GiveawayModule | null> {
		const data = await this.prisma.giveaway.findUnique({
			where: {
				id
			},
			include: {
				prizes: {
					include: {
						winners: true
					}
				}
			}
		});

		return data && new GiveawayModule(data, this.guild);
	}

	public async getAll(filter?: {
		entryUserId?: string;
		winnerUserId?: string;
		hostUserId?: string;
	}): Promise<Array<GiveawayModule>> {
		const entry = filter?.entryUserId;
		const winner = filter?.winnerUserId;
		const host = filter?.hostUserId;

		const data = await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guild.id,
				hostUserId: host,
				entriesUserIds: entry ? { hasSome: entry } : undefined,
				prizes: winner
					? { some: { winners: { some: { userId: winner } } } }
					: undefined
			},
			orderBy: {
				id: "desc"
			},
			include: {
				prizes: {
					include: {
						winners: true
					}
				}
			}
		});

		return data.map((data) => new GiveawayModule(data, this.guild));
	}

	public async getWithOffset(
		skip: number,
		take: number
	): Promise<Array<Giveaway>> {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guild.id
			},
			orderBy: {
				id: "asc"
			},
			skip,
			take
		});
	}

	public async getNextGuildRelativeId(): Promise<number> {
		const data = await this.prisma.giveaway.findFirst({
			where: {
				guildId: this.guild.id
			},
			orderBy: {
				id: "desc"
			},
			select: {
				guildRelativeId: true
			}
		});

		return (data?.guildRelativeId ?? 0) + 1;
	}

	public async getCountInGuild(): Promise<number> {
		return await this.prisma.giveaway.count({
			where: {
				guildId: this.guild.id
			}
		});
	}

	public async create(
		data: Prisma.GiveawayCreateInput
	): Promise<GiveawayModule> {
		const data_ = await this.prisma.giveaway.create({
			data,
			include: {
				prizes: {
					include: {
						winners: true
					}
				}
			}
		});

		return new GiveawayModule(data_, this.guild);
	}

	public async delete(...giveawayIds: Array<number>) {
		return await this.prisma.giveaway.deleteMany({
			where: {
				id: {
					in: giveawayIds
				}
			}
		});
	}

	public async edit(
		args: Exclude<Prisma.GiveawayUpdateArgs, "select" | "where">
	): Promise<GiveawayModule> {
		const data = await this.prisma.giveaway.update({
			...args,
			include: {
				prizes: {
					include: {
						winners: true
					}
				}
			}
		});

		return new GiveawayModule(data, this.guild);
	}

	public async getPrize(prizeId: number): Promise<PrizeModule | null> {
		const data = await this.prisma.prize.findFirst({
			where: {
				id: prizeId
			},
			include: {
				giveaway: true,
				winners: true
			}
		});

		if (!data) {
			return null;
		}

		const giveaway = await this.get(data.giveawayId);

		if (!giveaway) {
			return null;
		}

		return new PrizeModule({ ...data, giveaway }, this.guild);
	}

	public async getPrizes(filter?: {
		giveawayId?: number;
		winnerUserId?: string;
		claimed?: boolean;
	}): Promise<Array<PrizeModule>> {
		const id = filter?.giveawayId;
		const userId = filter?.winnerUserId;
		const claimed = filter?.claimed;

		const data = await this.prisma.prize.findMany({
			where: {
				giveawayId: id,
				winners:
					userId || claimed
						? { some: { userId, claimed } }
						: undefined
			},
			orderBy: {
				id: "desc"
			},
			include: {
				giveaway: true,
				winners: true
			}
		});

		const giveawayIds = [...new Set(data.map((data) => data.giveawayId))];

		const giveaways = await this.prisma.giveaway
			.findMany({
				where: {
					guildId: this.guild.id,
					id: {
						in: giveawayIds
					}
				},
				include: {
					prizes: {
						include: {
							winners: true
						}
					}
				}
			})
			.then((data) =>
				data.map((giveaway) => new GiveawayModule(giveaway, this.guild))
			);

		return data.map((data) => {
			const giveaway = giveaways.find(
				({ id }) => id === data.giveawayId
			)!;

			return new PrizeModule({ ...data, giveaway }, this.guild);
		});
	}

	// Prisma.PrizeCreateInput is weird and i dont know why
	public async createPrize(data: Prisma.PrizeCreateArgs["data"]) {
		const data_ = await this.prisma.prize.create({ data });

		const giveaway = await this.get(data_.giveawayId);

		if (!giveaway) {
			return data_;
		}

		return new PrizeModule({ ...data_, giveaway, winners: [] }, this.guild);
	}

	public async editPrize(args: Prisma.PrizeUpdateArgs) {
		const data = await this.prisma.prize.update({
			...args,
			include: {
				winners: true
			}
		});

		const giveaway = await this.get(data.giveawayId);

		if (!giveaway) {
			return data;
		}

		return new PrizeModule({ ...data, giveaway, winners: [] }, this.guild);
	}

	public async deletePrize(prizeOrPrizeId: Prize | number) {
		const id =
			typeof prizeOrPrizeId === "number"
				? prizeOrPrizeId
				: prizeOrPrizeId.id;

		return void (await this.prisma.prize.delete({
			where: {
				id
			}
		}));
	}

	public async deletePrizes(
		prizeIds: Array<number> | GiveawayModule | GiveawayWithIncludes
	) {
		let ids: Array<number>;

		if ("length" in prizeIds) {
			ids = prizeIds;
		} else {
			ids = prizeIds.prizes.map((prize) => prize.id);
		}

		return await this.prisma.prize.deleteMany({
			where: {
				id: {
					in: ids
				}
			}
		});
	}

	public async createWinners(...args: Array<Prisma.WinnerCreateManyInput>) {
		return await this.prisma.winner.createMany({
			data: args
		});
	}

	public async editWinner(args: Prisma.WinnerUpdateArgs) {
		return await this.prisma.winner.update(args);
	}

	public async deleteWinners(
		prizeIds: Array<number> | GiveawayModule | GiveawayWithIncludes,
		options?: {
			onlyDeleteUnclaimed?: true;
		}
	) {
		let ids: Array<number>;

		if ("length" in prizeIds) {
			ids = prizeIds;
		} else {
			ids = prizeIds.prizes.map((prize) => prize.id);
		}

		if (options?.onlyDeleteUnclaimed) {
			return await this.prisma.winner.deleteMany({
				where: {
					prizeId: {
						in: ids
					},
					claimed: false
				}
			});
		}

		return await this.prisma.winner.deleteMany({
			where: {
				prizeId: {
					in: ids
				}
			}
		});
	}

	public async setWinnerClaimed(options: {
		claimed: boolean;
		prizeId: number;
		userId: string;
	}): Promise<Prisma.BatchPayload>;
	public async setWinnerClaimed(options: {
		claimed: boolean;
		winnerId: number;
	}): Promise<Winner>;
	public async setWinnerClaimed(options: {
		claimed: boolean;
		prizeId?: number;
		userId?: string;
		winnerId?: number;
	}): Promise<Prisma.BatchPayload | Winner> {
		const { prizeId, claimed, winnerId: id, userId } = options;

		if (userId) {
			return await this.prisma.winner.updateMany({
				where: {
					prizeId,
					userId
				},
				data: {
					claimed
				}
			});
		}

		return await this.prisma.winner.update({
			where: {
				id
			},
			data: {
				claimed
			}
		});
	}
}
