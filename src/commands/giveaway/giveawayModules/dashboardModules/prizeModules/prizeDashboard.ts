import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	type ButtonInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import { giveawayComponents } from "../../../../../components/index.js";
import { EMOJIS } from "../../../../../constants.js";
import type GiveawayManager from "../../../../../database/giveaway.js";
import Logger from "../../../../../logger/logger.js";
import toManagePrizes from "../managePrizes.js";
import toEditPrize from "./editPrize.js";

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

	const msg = await interaction.editReply({
		components: [row],
		content: null,
		embeds: [prize.toEmbed()]
	});

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		max: 1
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction.reply({
			content: `${EMOJIS.NO_ENTRY} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case "back": {
				await buttonInteraction.deferUpdate();

				return toManagePrizes(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);
			}

			case "editPrize": {
				return toEditPrize(
					buttonInteraction,
					prize,
					giveawayManager,
					giveawayId
				);
			}

			case "deletePrize": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.deletePrize(prize.id);

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Deleted prize ${prize.id} in giveaway #${giveawayId}`
				);

				return toManagePrizes(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);
			}
		}
	});
}
