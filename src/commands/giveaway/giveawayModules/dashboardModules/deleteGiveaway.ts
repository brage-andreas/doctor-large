import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import toDashboard from "../dashboard.js";

export default async function toDeleteGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.reply({
			components: [],
			ephemeral: true,
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.WARN} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	await toDashboard(interaction, id);
}
