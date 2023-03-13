import components from "#components";
import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import Logger from "#logger";
import {
	ComponentType,
	type ButtonInteraction,
	type ModalSubmitInteraction
} from "discord.js";
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
			content: `${Emojis.Error} This prize does not exist. Try again.`
		});

		toManagePrizes(interaction, giveawayId, giveawayManager);

		return;
	}

	const rows = components.createRows(
		components.buttons.back,
		components.buttons.edit,
		components.buttons.delete_
	);

	const msg = await interaction.editReply({
		components: rows,
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
			content: `${Emojis.NoEntry} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				await buttonInteraction.deferUpdate();

				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.edit.customId: {
				toEditPrize(
					buttonInteraction,
					prize,
					giveawayManager,
					giveawayId
				);

				break;
			}

			case components.buttons.delete_.customId: {
				await buttonInteraction.deferUpdate();

				await giveawayManager.deletePrize(prize.id);

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Deleted prize ${prize.id} in giveaway #${giveawayId}`
				);

				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}
		}
	});
}
