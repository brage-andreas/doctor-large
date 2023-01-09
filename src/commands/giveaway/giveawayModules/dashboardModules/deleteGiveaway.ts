import { stripIndents } from "common-tags";
import { ButtonStyle, type ButtonInteraction } from "discord.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import yesNo from "../../../../helpers/yesNo.js";
import toDashboard from "../dashboard.js";

export default async function toDeleteGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.WARN} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const accept = yesNo({
		yesStyle: ButtonStyle.Danger,
		noStyle: ButtonStyle.Success,
		medium: interaction,
		filter: () => true,
		data: {
			content: stripIndents`
			${EMOJIS.DANGER} You are about to delete giveaway #${giveaway.guildRelativeId}.

			Are you sure? Absolutely sure? This action will be **irreversible**.
		`
		}
	});

	accept;

	await toDashboard(interaction, id);
}
