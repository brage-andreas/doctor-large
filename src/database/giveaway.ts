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

	public async getAllActive() {
		return await this.prisma.giveaway.findMany({
			where: {
				guildId: this.guildId,
				active: true
			}
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

	public async edit(args: Prisma.giveawayUpdateArgs) {
		return await this.prisma.giveaway.update(args);
	}

	public async editPrize(args: Prisma.giveawayPrizeUpdateArgs) {
		return await this.prisma.giveawayPrize.update(args);
	}
}
