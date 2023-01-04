import { type Giveaway, type Prisma } from "@prisma/client";
import {
	type GiveawayWithIncludes,
	type PrizeWithIncludes
} from "../typings/database.js";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly guildId: string;
	public readonly prisma = prisma;

	public constructor(guildId: string) {
		this.guildId = guildId;
	}

	public async get(id: number): Promise<GiveawayWithIncludes> {
		return await this.prisma.giveaway.findUniqueOrThrow({
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
	}

	public async getAll(filter?: {
		entryUserId?: string;
		winnerUserId?: string;
		hostUserId?: string;
	}): Promise<Array<GiveawayWithIncludes>> {
		const entry = filter?.entryUserId;
		const winner = filter?.winnerUserId;
		const host = filter?.hostUserId;

		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId,
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
	}

	public async getWithOffset(
		skip: number,
		take: number
	): Promise<Array<Giveaway>> {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId
			},
			orderBy: {
				id: "asc"
			},
			skip,
			take
		});
	}

	public async getQuantityInGuild(): Promise<number> {
		return await this.prisma.giveaway.count({
			where: {
				guildId: this.guildId
			}
		});
	}

	public async create(data: Prisma.GiveawayCreateInput): Promise<Giveaway> {
		return await this.prisma.giveaway.create({
			data
		});
	}

	public async edit(args: Prisma.GiveawayUpdateArgs): Promise<Giveaway> {
		return await this.prisma.giveaway.update(args);
	}

	public async getPrize(prizeId: number): Promise<PrizeWithIncludes | null> {
		return await this.prisma.prize.findFirst({
			where: {
				id: prizeId
			},
			include: {
				giveaway: true,
				winners: true
			}
		});
	}

	public async getPrizes(filter?: {
		giveawayId?: number;
		winnerUserId?: string;
		winnerAccepted?: boolean;
	}): Promise<Array<PrizeWithIncludes>> {
		const id = filter?.giveawayId;
		const userId = filter?.winnerUserId;
		const accepted = filter?.winnerAccepted;

		return await this.prisma.prize.findMany({
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
	}

	public async createPrizes(...args: Array<Prisma.PrizeCreateManyInput>) {
		return await this.prisma.prize.createMany({
			data: args
		});
	}

	public async editPrize(args: Prisma.PrizeUpdateArgs) {
		return await this.prisma.prize.update(args);
	}

	public async getUniqueWinnerCount(giveawayId: number): Promise<number> {
		const data = await this.prisma.prize.findMany({
			where: {
				giveawayId
			},
			include: {
				winners: true
			}
		});

		return data.reduce((set, e) => {
			e.winners.forEach((winner) => set.add(winner.userId));

			return set;
		}, new Set<string>()).size;
	}

	public async upsertWinner(args: Prisma.WinnerCreateInput) {
		if (!args.prize.connect?.id) {
			throw new Error("prize.connect is undefined");
		}

		return await this.prisma.winner.upsert({
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

	public async updateWinnerAcceptance({
		accepted,
		prizeId,
		userId
	}: {
		accepted: boolean;
		prizeId: number;
		userId: string;
	}) {
		return await this.prisma.winner.update({
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
