import { type Guild } from "discord.js";
import GiveawayManager from "../../../../../database/giveaway.js";
import roll from "./roll.js";
import { sortValidEntrants } from "./validEntrants.js";

export async function signWinners(options: {
	giveawayId: number;
	guild: Guild;
}) {
	const { guild, giveawayId } = options;

	const giveawayManager = new GiveawayManager(guild);
	const giveaway = await giveawayManager.get(giveawayId);

	const entries = await sortValidEntrants(giveaway, guild);

	const dataMap = roll(entries, giveaway);

	if (!dataMap?.size) {
		return;
	}

	for (const [giveawayId, data] of dataMap.entries()) {
		for (const { userId, quantityWon } of data) {
			await giveawayManager.upsertWinner({
				quantityWon,
				userId,
				prize: {
					connect: {
						id: giveawayId
					}
				}
			});
		}
	}
}
