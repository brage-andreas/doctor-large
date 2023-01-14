import { type Guild } from "discord.js";
import GiveawayManager from "../../../../../database/giveaway.js";
import roll from "./roll.js";

export async function signWinners(options: {
	giveawayId: number;
	guild: Guild;
}) {
	const { guild, giveawayId } = options;

	const giveawayManager = new GiveawayManager(guild);
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return;
	}

	const members = await guild.members.fetch({ force: true });
	const entries = [...members.values()].filter(
		(member) =>
			giveaway.entriesUserIds.has(member.id) &&
			giveaway.isOldEnough(member) &&
			giveaway.memberHasRequiredRoles(member)
	);

	const dataMap = roll(
		entries.map((m) => m.id),
		giveaway
	);

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
