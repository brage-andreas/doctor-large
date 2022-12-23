import { type ButtonInteraction } from "discord.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import toDashboard from "../dashboard.js";

export default async function toResetData(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	await toDashboard(interaction, id);
}
