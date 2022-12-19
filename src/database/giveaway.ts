import { type Prisma } from "@prisma/client";
import {
	type CompleteGiveaway,
	type CompleteGiveawayPrize,
	type CompleteGiveawayWinners
} from "../typings/database.js";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly guildId: string;
	public readonly prisma = prisma;

	public constructor(guildId: string) {
		this.guildId = guildId;
	}

	public async get(id: number): Promise<CompleteGiveaway | null> {
		return await this.prisma.giveaway.findUnique({
			where: {
				giveawayId: id
			},
			include: {
				prizes: {
					include: {
						winner: true
					}
				}
			}
		});
	}

	public async getPrizes(
		giveawayId: number
	): Promise<Array<CompleteGiveawayPrize>> {
		return await this.prisma.giveawayPrize.findMany({
			where: {
				giveawayId
			},
			include: {
				giveaway: true,
				winner: true
			}
		});
	}

	public async getWinners(
		giveawayId: number
	): Promise<Array<CompleteGiveawayWinners>> {
		return await this.prisma.giveawayWinner.findMany({
			where: {
				giveawayId
			},
			include: {
				prizes: {
					include: {
						giveaway: true
					}
				}
			}
		});
	}

	public async getAll(): Promise<Array<CompleteGiveaway>> {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId
			},
			orderBy: {
				giveawayId: "desc"
			},
			include: {
				prizes: {
					include: {
						winner: true
					}
				}
			}
		});
	}

	public async getWithOffset(offset: number, limit = 5) {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId
			},
			skip: offset,
			take: limit
		});
	}

	public async getTotalNumberOfGiveawaysInGuild() {
		return (
			await this.prisma.giveaway.findMany({
				where: {
					guildId: this.guildId
				}
			})
		).length;
	}

	public async create(data: Prisma.giveawayCreateInput) {
		return await this.prisma.giveaway.create({
			data
		});
	}

	public async createPrizes(
		...data: Array<Prisma.giveawayPrizeCreateManyInput>
	) {
		return await this.prisma.giveawayPrize.createMany({
			data
		});
	}

	public async upsertWinner(data: Prisma.giveawayWinnerCreateInput) {
		return await this.prisma.giveawayWinner.upsert({
			create: data,
			update: {
				accepted: data.accepted,
				prizes: data.prizes
			},
			where: {
				userId_giveawayId: {
					giveawayId: data.giveawayId,
					userId: data.userId
				}
			}
		});
	}

	public async edit(args: Prisma.giveawayUpdateArgs) {
		return await this.prisma.giveaway.update(args);
	}

	public async editPrize(args: Prisma.giveawayPrizeUpdateArgs) {
		return await this.prisma.giveawayPrize.update(args);
	}

	public async editWinner(args: Prisma.giveawayWinnerUpdateArgs) {
		return await this.prisma.giveawayWinner.update(args);
	}
}
