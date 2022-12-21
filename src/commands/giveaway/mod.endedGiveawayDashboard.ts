import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	type ButtonInteraction,
	type CommandInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import GiveawayManager from "../../database/giveaway.js";
import lastEditBy from "../../helpers/lastEdit.js";
import { type CompleteGiveaway } from "../../typings/database.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import toEditGiveaway from "./dashboardModules/editGiveaway.js";
import toManagePrizes from "./dashboardModules/managePrizes.js";
import toPublishGiveaway from "./dashboardModules/publishGiveaway.js";
import toPublishingOptions from "./dashboardModules/publishingOptions.js";
import toResetData from "./dashboardModules/resetData.js";
import toSetEndDate from "./dashboardModules/setEndDate.js";
import toSetPingRoles from "./dashboardModules/setPingRoles.js";
import toSetRequiredRoles from "./dashboardModules/setRequiredRoles.js";
import toEndGiveaway from "./mod.dashboard.endGiveaway.js";
import formatGiveaway from "./mod.formatGiveaway.js";

const dashboard = async (
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayManager: GiveawayManager,
	giveawayId: number,
	giveaway: CompleteGiveaway
) => {
	const reactivateButton = new ButtonBuilder()
		.setCustomId("reactivate")
		.setLabel("Reactivate")
		.setStyle(ButtonStyle.Secondary);

	const publishWinnersButton = new ButtonBuilder()
		.setCustomId("publishWinners")
		.setLabel("Publish winners")
		.setStyle(ButtonStyle.Secondary);

	const republishWinnersButton = new ButtonBuilder()
		.setCustomId("republishWinners")
		.setLabel("Republish winners")
		.setStyle(ButtonStyle.Secondary);

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents();

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents();

	const msg = await interaction.editReply({
		content: formatGiveaway(giveaway, false, interaction.guild),
		components: [row1, row2],
		embeds: []
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
			content: "🚫 This button is not for you.",
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case "publishGiveaway": {
				await buttonInteraction.deferUpdate();

				toPublishGiveaway(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case "publishingOptions": {
				await buttonInteraction.deferUpdate();

				toPublishingOptions(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case "lockEntries": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: { giveawayId },
					data: {
						lockEntries: true,
						...lastEditBy(interaction.user)
					}
				});

				dashboard(buttonInteraction, giveawayId);

				break;
			}

			case "unlockEntries": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: { giveawayId },
					data: {
						lockEntries: false,
						...lastEditBy(interaction.user)
					}
				});

				dashboard(buttonInteraction, giveawayId);

				break;
			}

			case "setEndDate": {
				await buttonInteraction.deferUpdate();

				toSetEndDate(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "setRequiredRoles": {
				await buttonInteraction.deferUpdate();

				toSetRequiredRoles(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case "setPingRoles": {
				await buttonInteraction.deferUpdate();

				toSetPingRoles(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "editGiveaway": {
				// await buttonInteraction.deferUpdate();
				// Showing modal

				toEditGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "managePrizes": {
				await buttonInteraction.deferUpdate();

				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "endGiveaway": {
				await buttonInteraction.deferUpdate();

				toEndGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "resetData": {
				await buttonInteraction.deferUpdate();

				toResetData(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "deleteGiveaway": {
				await buttonInteraction.deferUpdate();

				toDeleteGiveaway(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}
		}
	});

	collector.on("end", (_, reason) => {
		if (reason !== "time") {
			return;
		}

		msg.edit({ components: [] }).catch(() => null);
	});
};

export default async function toDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayId: number
) {
	await dashboard(interaction, giveawayId);
}
