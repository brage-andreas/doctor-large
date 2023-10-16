import { type Client, EmbedBuilder, type Guild } from "discord.js";
import { type PrizeId, type PrizeWithIncludes } from "#typings";
import type GiveawayManager from "#database/giveaway.js";
import { type Prize, type Winner } from "@prisma/client";
import { oneLine, stripIndents } from "common-tags";
import type GiveawayModule from "./Giveaway.js";
import { longstamp } from "#helpers";
import { Colors } from "#constants";

export default class PrizeModule implements Prize {
	// -- Raw data --
	public additionalInfo: null | string;
	public readonly client: Client;
	public createdAt: Date;
	public data: PrizeWithIncludes;

	public giveaway: GiveawayModule;
	public giveawayId: number;
	public readonly guild: Guild;
	public id: PrizeId;
	public readonly manager: GiveawayManager;
	public name: string;
	public quantity: number;
	public winners: Array<Winner>;
	// --------------

	public constructor(data: PrizeWithIncludes, guild: Guild) {
		this.manager = data.giveaway.manager;
		this.client = guild.client;
		this.guild = guild;
		this.data = data;

		this.additionalInfo = data.additionalInfo;
		this.giveawayId = data.giveawayId;
		this.createdAt = data.createdAt;
		this.giveaway = data.giveaway;
		this.quantity = data.quantity;
		this.winners = data.winners;
		this.name = data.name;
		this.id = data.id;
	}

	public clone() {
		return new PrizeModule(this.data, this.guild);
	}

	public toEmbed() {
		const embed = new EmbedBuilder()
			.setTitle(this.name)

			.setColor(this.winners.length > 0 ? Colors.Green : Colors.Yellow)
			.setFields({
				name: "Info",
				value: stripIndents`
					Created: ${longstamp(this.createdAt)}
					Quantity: ${this.quantity}
					Winners: ${this.winners.length || "None"}
				`,
			});

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		embed.setDescription(this.additionalInfo || "No additional info.");

		return embed;
	}

	public toShortString() {
		return oneLine`
			${this.data.quantity}x ${this.data.name}
			${this.data.additionalInfo ? `- ${this.data.additionalInfo}` : ""}
		`;
	}
}
