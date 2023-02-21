import {
	ActionRowBuilder,
	ComponentType,
	type ButtonBuilder,
	type ButtonInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import components from "../../../../../components/index.js";
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

	const { back, edit, delete_ } = components.buttons;

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		back.component(),
		edit.component(),
		delete_.component()
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
			case back.customId: {
				await buttonInteraction.deferUpdate();

				return toManagePrizes(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);
			}

			case edit.customId: {
				return toEditPrize(
					buttonInteraction,
					prize,
					giveawayManager,
					giveawayId
				);
			}

			case delete_.customId: {
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
