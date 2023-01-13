import { type GiveawayData, type Prisma } from "@prisma/client";
import { type Client, type Guild } from "discord.js";
import Giveaway from "../modules/Giveaway.js";
import Prize from "../modules/Prize.js";
import { type GiveawayDataWithIncludes } from "../typings/database.js";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly prisma = prisma;
	public readonly client: Client;
	public readonly guild: Guild;

	public constructor(guild: Guild) {
		this.client = guild.client;
		this.guild = guild;
	}

	public async get(id: number): Promise<Giveaway | null> {
		const data = await this.prisma.giveawayData.findUnique({
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

		return data && new Giveaway(data, this.guild);
	}

	public async getAll(filter?: {
		entryUserId?: string;
		winnerUserId?: string;
		hostUserId?: string;
	}): Promise<Array<Giveaway>> {
		const entry = filter?.entryUserId;
		const winner = filter?.winnerUserId;
		const host = filter?.hostUserId;

		const data = await this.prisma.giveawayData.findMany({
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

		return data.map((data) => new Giveaway(data, this.guild));
	}

	public async getWithOffset(
		skip: number,
		take: number
	): Promise<Array<GiveawayData>> {
		return await this.prisma.giveawayData.findMany({
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
		const data = await this.prisma.giveawayData.findFirst({
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
		return await this.prisma.giveawayData.count({
			where: {
				guildId: this.guild.id
			}
		});
	}

	public async create(
		data: Prisma.GiveawayDataCreateInput
	): Promise<Giveaway> {
		const data_ = await this.prisma.giveawayData.create({
			data,
			include: {
				prizes: {
					include: {
						winners: true
					}
				}
			}
		});

		return new Giveaway(data_, this.guild);
	}

	public async delete(...giveawayIds: Array<number>) {
		return await this.prisma.giveawayData.deleteMany({
			where: {
				id: {
					in: giveawayIds
				}
			}
		});
	}

	public async edit(
		args: Exclude<Prisma.GiveawayDataUpdateArgs, "select" | "where">
	): Promise<Giveaway> {
		const data = await this.prisma.giveawayData.update({
			...args,
			include: {
				prizes: {
					include: {
						winners: true
					}
				}
			}
		});

		return new Giveaway(data, this.guild);
	}

	public async getPrize(prizeId: number): Promise<Prize | null> {
		const data = await this.prisma.prizeData.findFirst({
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

		return new Prize({ ...data, giveaway }, this.guild);
	}

	public async getPrizes(filter?: {
		giveawayId?: number;
		winnerUserId?: string;
		winnerAccepted?: boolean;
	}): Promise<Array<Prize>> {
		const id = filter?.giveawayId;
		const userId = filter?.winnerUserId;
		const accepted = filter?.winnerAccepted;

		const data = await this.prisma.prizeData.findMany({
			where: {
				giveawayId: id,
				winners:
					userId || accepted
						? { some: { userId, accepted } }
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

		const giveaways = await this.prisma.giveawayData
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
				data.map((giveaway) => new Giveaway(giveaway, this.guild))
			);

		return data.map((data) => {
			const giveaway = giveaways.find(
				({ id }) => id === data.giveawayId
			)!;

			return new Prize({ ...data, giveaway }, this.guild);
		});
	}

	// Prisma.PrizeDataCreateData is being weird, but this works
	public async createPrize(data: Prisma.PrizeDataCreateArgs["data"]) {
		const data_ = await this.prisma.prizeData.create({ data });

		const giveaway = await this.get(data_.giveawayId);

		if (!giveaway) {
			return data_;
		}

		return new Prize({ ...data_, giveaway, winners: [] }, this.guild);
	}

	public async editPrize(args: Prisma.PrizeDataUpdateArgs) {
		return await this.prisma.prizeData.update(args);
	}

	public async deletePrize(prizeOrPrizeId: Prize | number) {
		const id =
			typeof prizeOrPrizeId === "number"
				? prizeOrPrizeId
				: prizeOrPrizeId.id;

		return await this.prisma.prizeData.delete({
			where: {
				id
			}
		});
	}

	public async deletePrizes(
		prizeIds: Array<number> | Giveaway | GiveawayDataWithIncludes
	) {
		let ids: Array<number>;

		if ("length" in prizeIds) {
			ids = prizeIds;
		} else {
			ids = prizeIds.prizes.map((prize) => prize.id);
		}

		return await this.prisma.prizeData.deleteMany({
			where: {
				id: {
					in: ids
				}
			}
		});
	}

	public async upsertWinner(args: Prisma.WinnerDataCreateInput) {
		if (!args.prize.connect?.id) {
			throw new Error("prize.connect is undefined");
		}

		return await this.prisma.winnerData.upsert({
			create: args,
			update: {
				accepted: args.accepted,
				quantityWon: args.quantityWon
			},
			where: {
				prizeId_userId: {
					prizeId: args.prize.connect.id,
					userId: args.userId
				}
			}
		});
	}

	public async deleteWinners(
		prizeIds: Array<number> | Giveaway | GiveawayDataWithIncludes
	) {
		let ids: Array<number>;

		if ("length" in prizeIds) {
			ids = prizeIds;
		} else {
			ids = prizeIds.prizes.map((prize) => prize.id);
		}

		return await this.prisma.prizeData.deleteMany({
			where: {
				id: {
					in: ids
				}
			}
		});
	}

	public async updateWinnerAcceptance({
		accepted,
		prizeId,
		userId
	}: {
		accepted: boolean;
		prizeId: number;
		userId: string;
	}) {
		return await this.prisma.winnerData.update({
			data: {
				accepted
			},
			where: {
				prizeId_userId: {
					prizeId,
					userId
				}
			}
		});
	}
}
