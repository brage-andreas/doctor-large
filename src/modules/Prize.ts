import { type PrizeData, type WinnerData } from "@prisma/client";
import { oneLine } from "common-tags";
import { type Client, type Guild } from "discord.js";
import type Giveaway from "./Giveaway.js";

export default class Prize {
	public data: PrizeData & { winners: Array<WinnerData>; giveaway: Giveaway };
	public guild: Guild;
	public client: Client;

	public additionalInfo: string | null;
	public giveaway: Giveaway;
	public giveawayId: number;
	public id: number;
	public name: string;
	public quantity: number;

	/**
	 * Mapped by userId
	 */
	public winners: Map<string, WinnerData>;

	public constructor(
		data: PrizeData & { winners: Array<WinnerData>; giveaway: Giveaway },
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
		}, new Map<string, WinnerData>());
	}

	public toShortString() {
		return oneLine`
			${this.data.quantity}x ${this.data.name}
			${this.data.additionalInfo ? `- ${this.data.additionalInfo}` : ""}
		`;
	}
}
