import components from "#components";
import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import Logger from "#logger";
import {
	ActionRowBuilder,
	ComponentType,
	type ButtonBuilder,
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
			content: `${Emojis.NoEntry} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case back.customId: {
				await buttonInteraction.deferUpdate();

				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case edit.customId: {
				toEditPrize(
					buttonInteraction,
					prize,
					giveawayManager,
					giveawayId
				);

				break;
			}

			case delete_.customId: {
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
