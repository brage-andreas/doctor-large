import { type ButtonInteraction, ComponentType, type ModalSubmitInteraction } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import toManagePrizes from "../manage-prizes.js";
import components from "#discord-components";
import toEditPrize from "./edit-prize.js";
import { Emojis } from "#constants";
import Logger from "#logger";

export default async function toPrizeDashboard(
	interaction: ButtonInteraction<"cached"> | ModalSubmitInteraction<"cached">,
	prizeId: number,
	giveawayManager: GiveawayManager,
	giveawayId: number
) {
	const prize = await giveawayManager.getPrize(prizeId);

	if (!prize) {
		interaction
			.followUp({
				content: `${Emojis.Error} This prize does not exist. Try again.`,
				ephemeral: true,
			})
			.catch(() => null);

		void toManagePrizes(interaction, giveawayId, giveawayManager);

		return;
	}

	const rows = components.createRows(components.buttons.back, components.buttons.edit, components.buttons.delete_);

	const message = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [prize.toEmbed()],
	});

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
		max: 1,
		time: 120_000,
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction
			.reply({
				content: `${Emojis.NoEntry} This button is not for you.`,
				ephemeral: true,
			})
			.catch(() => null);
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				await buttonInteraction.deferUpdate();

				void toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.edit.customId: {
				void toEditPrize(buttonInteraction, prize, giveawayManager, giveawayId);

				break;
			}

			case components.buttons.delete_.customId: {
				await buttonInteraction.deferUpdate();

				await giveawayManager.deletePrize(prize.id);

				new Logger({ interaction, label: "GIVEAWAY" }).log(
					`Deleted prize ${prize.id} in giveaway #${giveawayId}`
				);

				void toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}
		}
	});
}
