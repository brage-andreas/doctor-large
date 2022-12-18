import { type Prisma } from "@prisma/client";
import prisma from "./prisma.js";

export default class GiveawayManager {
	public readonly guildId: string;
	public readonly prisma = prisma;

	public constructor(guildId: string) {
		this.guildId = guildId;
	}

	public async get(id: number) {
		return await this.prisma.giveaway.findUnique({
			where: {
				giveawayId: id
			}
		});
	}

	public async getPrizes(giveawayId: number) {
		return await this.prisma.giveawayPrize.findMany({
			where: {
				giveawayId
			}
		});
	}

	public async getWinners(giveawayId: number) {
		return await this.prisma.giveawayWinner.findMany({
			where: {
				giveawayId
			}
		});
	}

	public async getAll() {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId
			},
			orderBy: {
				giveawayId: "desc"
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

	public async createWinners(
		...data: Array<Prisma.giveawayWinnerCreateManyInput>
	) {
		return await this.prisma.giveawayWinner.createMany({
			data
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
