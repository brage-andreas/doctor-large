import { type giveaway, type Prisma } from "@prisma/client";
import { oneLine, stripIndents } from "common-tags";
import { EmbedBuilder, type Client } from "discord.js";
import { listify } from "../helpers/listify.js";
import { timestamp } from "../helpers/timestamps.js";
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

	/*public async getLatest(currentId?: number) {
		return await this.prisma.giveaway.findFirst({
			where: {
				guildId: this.guildId,
				NOT: {
					giveawayId: currentId
				}
			},
			orderBy: {
				giveawayId: "desc"
			}
		});
	}*/

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

	public async edit(args: Prisma.giveawayUpdateArgs) {
		return await this.prisma.giveaway.update(args);
	}

	public async editPrize(args: Prisma.giveawayPrizeUpdateArgs) {
		return await this.prisma.giveawayPrize.update(args);
	}

	public toEmbed(data: giveaway, client: Client) {
		const lockedStr = data.lockEntries
			? "🔒 Entries are currently locked."
			: null;

		const roleGateStr = data.requiredRoles.length
			? "🔒 You need specific roles to enter this Giveaway."
			: null;

		const roles = client.guilds.cache
			.get(data.guildId)
			?.roles.cache.filter((role) => data.requiredRoles.includes(role.id))
			.sort((a, b) => a.position - b.position)
			.map((role) => role.toString());

		const rolesStr = roles && listify(roles, { length: 5 });

		const timestampInfo = data.endTimestamp
			? oneLine`
				• The Giveaway closes
				${timestamp(data.endTimestamp, "F")}
				(${timestamp(data.endTimestamp, "R")}).
				Until then, cross your fingers 🤞
			`
			: "• The Giveaway is open indefinitely. Enter while you can!";

		const numberOfWinnersInfo = oneLine`
			• There can be ${data.numberOfWinners}
			winner${data.numberOfWinners === 1 ? "" : "s"}! 😁
		`;

		const requiredRolesInfo =
			rolesStr && `• Roles required to enter: ${rolesStr}`;

		return new EmbedBuilder()
			.setTitle(data.giveawayTitle)
			.setDescription(
				stripIndents`
					${lockedStr ? lockedStr : roleGateStr ? roleGateStr : ""}
					
					${data.giveawayDescription}

					${timestampInfo}\n${numberOfWinnersInfo}\n${requiredRolesInfo ?? ""}`
			)
			.setFooter({ text: `${data.hostUserTag} (${data.hostUserId})` })
			.setTimestamp(Number(data.createdTimestamp))
			.addFields({
				name: "Prizes",
				value: "WIP"
			});
	}
}
