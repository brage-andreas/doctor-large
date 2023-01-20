import { type Prize, type Winner } from "@prisma/client";
import { oneLine } from "common-tags";
import { EmbedBuilder, type Client, type Guild } from "discord.js";
import { COLORS } from "../constants.js";
import type GiveawayModule from "./Giveaway.js";

export default class PrizeModule {
	public data: Prize & { winners: Array<Winner>; giveaway: GiveawayModule };
	public guild: Guild;
	public client: Client;

	public additionalInfo: string | null;
	public giveaway: GiveawayModule;
	public giveawayId: number;
	public id: number;
	public name: string;
	public quantity: number;

	/**
	 * Mapped by userId
	 */
	public winners: Map<string, Winner>;

	public constructor(
		data: Prize & { winners: Array<Winner>; giveaway: GiveawayModule },
		guild: Guild
	) {
		this.data = data;
		this.guild = guild;
		this.client = guild.client;

		this.additionalInfo = data.additionalInfo;
		this.giveawayId = data.giveawayId;
		this.giveaway = data.giveaway;
		this.quantity = data.quantity;
		this.name = data.name;
		this.id = data.id;

		this.winners = data.winners.reduce((map, winner) => {
			map.set(winner.userId, winner);

			return map;
		}, new Map<string, Winner>());
	}

	public clone() {
		return new PrizeModule(this.data, this.guild);
	}

	public toShortString() {
		return oneLine`
			${this.data.quantity}x ${this.data.name}
			${this.data.additionalInfo ? `- ${this.data.additionalInfo}` : ""}
		`;
	}

	public toEmbed() {
		const winners = [...this.winners.values()].map(
			({ userId, claimed }) =>
				`<@${userId}> won 1x ${!claimed ? "(Not claimed)" : ""}`
		);

		return new EmbedBuilder()
			.setTitle(this.name)
			.setDescription(this.additionalInfo)
			.setColor(winners.length ? COLORS.GREEN : COLORS.YELLOW)
			.setFields(
				{
					inline: true,
					value: winners.length ? winners.join("\n") : "None",
					name: `Winners (${this.winners.size})`
				},
				{
					inline: true,
					value: `${this.quantity}`,
					name: "Quantity"
				}
			);
	}
}
