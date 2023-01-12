import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import { giveawayComponents } from "../../../../../components/index.js";
import { EMOJIS } from "../../../../../constants.js";
import type GiveawayManager from "../../../../../database/giveaway.js";
import toManagePrizes from "../managePrizes.js";

export default async function toPrizeDashboard(
	interaction: ButtonInteraction<"cached"> | ModalSubmitInteraction<"cached">,
	prizeId: number,
	giveawayManager: GiveawayManager,
	giveawayId: number
) {
	const prize = await giveawayManager.getPrize(prizeId);

	if (!prize) {
		interaction.followUp({
			ephemeral: true,
			content: `${EMOJIS.ERROR} This prize does not exist. Try again.`
		});

		return toManagePrizes(interaction, giveawayId, giveawayManager);
	}

	const editButton = new ButtonBuilder()
		.setCustomId("editPrize")
		.setStyle(ButtonStyle.Primary)
		.setLabel("Edit");

	const deleteButton = new ButtonBuilder()
		.setCustomId("deletePrize")
		.setStyle(ButtonStyle.Danger)
		.setLabel("Delete");

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton(),
		editButton,
		deleteButton
	);

	await interaction.editReply({
		components: [row],
		content: null,
		embeds: [prize.toEmbed()]
	});
}
