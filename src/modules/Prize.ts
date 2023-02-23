import { COLORS } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { longstamp } from "#helpers/timestamps.js";
import { type PrizeWithIncludes } from "#typings/database.js";
import { type PrizeId } from "#typings/index.js";
import { type Prize, type Winner } from "@prisma/client";
import { oneLine, stripIndents } from "common-tags";
import { EmbedBuilder, type Client, type Guild } from "discord.js";
import type GiveawayModule from "./Giveaway.js";

export default class PrizeModule implements Prize {
	public data: PrizeWithIncludes;
	public readonly client: Client;
	public readonly guild: Guild;
	public readonly manager: GiveawayManager;

	// -- Raw data --
	public additionalInfo: string | null;
	public createdAt: Date;
	public giveaway: GiveawayModule;
	public giveawayId: number;
	public id: PrizeId;
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

	public toShortString() {
		return oneLine`
			${this.data.quantity}x ${this.data.name}
			${this.data.additionalInfo ? `- ${this.data.additionalInfo}` : ""}
		`;
	}

	public toEmbed() {
		return new EmbedBuilder()
			.setTitle(this.name)
			.setDescription(this.additionalInfo || "No additional info.")
			.setColor(this.winners.length ? COLORS.GREEN : COLORS.YELLOW)
			.setFields({
				name: "Info",
				value: stripIndents`
					Created: ${longstamp(this.createdAt)}
					Quantity: ${this.quantity}
					Winners: ${this.winners.length || "None"}
				`
			});
	}
}
