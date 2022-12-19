import { type ButtonInteraction } from "discord.js";
import type GiveawayManager from "../../../database/giveaway.js";
import toDashboard from "../mod.dashboard.js";

export default async function toManagePrizes(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return;
	}

	await toDashboard(interaction, giveawayId);
}
