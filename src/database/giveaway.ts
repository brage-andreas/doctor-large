import { type Giveaway, type Prisma } from "@prisma/client";
import {
	type GiveawayWithIncludes,
	type PrizeWithIncludes
} from "../typings/database.js";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly guildId: string;
	public readonly prisma = prisma;

	public readonly prizes = {
		get: this.getPrizes,
		create: this.createPrizes,
		edit: this.editPrize
	};

	public readonly winners = {
		create: this.createWinners,
		edit: this.editWinners
	};

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

	public async getAll(): Promise<Array<GiveawayWithIncludes>> {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId
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
		offset: number,
		limit = 5
	): Promise<Array<Giveaway>> {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId
			},
			skip: offset,
			take: limit
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

	private async getPrizes(id: number): Promise<Array<PrizeWithIncludes>> {
		return await this.prisma.prize.findMany({
			where: {
				id
			},
			include: {
				giveaway: true,
				winners: true
			}
		});
	}

	private async createPrizes(...args: Array<Prisma.PrizeCreateManyInput>) {
		return await this.prisma.prize.createMany({
			data: args
		});
	}

	private async createWinners(...args: Array<Prisma.WinnerCreateManyInput>) {
		return await this.prisma.winner.createMany({ data: args });
	}

	private async editPrize(args: Prisma.PrizeUpdateArgs) {
		return await this.prisma.prize.update(args);
	}

	private async editWinners(args: Prisma.WinnerUpdateArgs) {
		return await this.prisma.winner.update(args);
	}
}
