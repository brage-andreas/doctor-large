import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	type ButtonBuilder,
	type ButtonInteraction,
	type CommandInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import GiveawayManager from "../../database/giveaway.js";
import lastEditBy from "../../helpers/lastEdit.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import toEditGiveaway from "./dashboardModules/editGiveaway.js";
import toEndGiveaway from "./dashboardModules/endGiveaway.js";
import toManagePrizes from "./dashboardModules/managePrizes.js";
import toPublishGiveaway from "./dashboardModules/publishGiveaway.js";
import toPublishingOptions from "./dashboardModules/publishingOptions.js";
import toResetData from "./dashboardModules/resetData.js";
import toSetEndDate from "./dashboardModules/setEndDate.js";
import toSetPingRoles from "./dashboardModules/setPingRoles.js";
import toSetRequiredRoles from "./dashboardModules/setRequiredRoles.js";
import toEndedDashboard from "./mod.endedGiveawayDashboard.js";
import formatGiveaway from "./mod.formatGiveaway.js";

export default async function toDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	id: number
) {
	const giveawayManager = new GiveawayManager(interaction.guildId);
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				⚠️ This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (!giveaway.active) {
		await toEndedDashboard(interaction, giveawayManager, giveaway);

		return;
	}

	const publishButton = giveaway.messageId
		? giveawayComponents.dashboard.row1.publishingOptionsButton()
		: giveawayComponents.dashboard.row1.publishGiveawayButton();

	const lockEntriesButton = giveaway.lockEntries
		? giveawayComponents.dashboard.row1.unlockEntriesButton()
		: giveawayComponents.dashboard.row1.lockEntriesButton();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishButton,
		lockEntriesButton,
		giveawayComponents.dashboard.row1.setEndDateButton(),
		giveawayComponents.dashboard.row1.setRequiredRolesButton(),
		giveawayComponents.dashboard.row1.setPingRolesButton()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		giveawayComponents.dashboard.row2.editButton(),
		giveawayComponents.dashboard.row2.managePrizesButton(),
		giveawayComponents.dashboard.row2.endGiveawayButton(),
		giveawayComponents.dashboard.row2.resetDataButton(),
		giveawayComponents.dashboard.row2.deleteGiveawayButton()
	);

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

				toPublishGiveaway(buttonInteraction, id, giveawayManager);

				break;
			}

			case "publishingOptions": {
				await buttonInteraction.deferUpdate();

				toPublishingOptions(buttonInteraction, id, giveawayManager);

				break;
			}

			case "lockEntries": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: { id },
					data: {
						lockEntries: true,
						...lastEditBy(interaction.user)
					}
				});

				toDashboard(buttonInteraction, id);

				break;
			}

			case "unlockEntries": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: { id },
					data: {
						lockEntries: false,
						...lastEditBy(interaction.user)
					}
				});

				toDashboard(buttonInteraction, id);

				break;
			}

			case "setEndDate": {
				await buttonInteraction.deferUpdate();

				toSetEndDate(buttonInteraction, id, giveawayManager);

				break;
			}

			case "setRequiredRoles": {
				await buttonInteraction.deferUpdate();

				toSetRequiredRoles(buttonInteraction, id, giveawayManager);

				break;
			}

			case "setPingRoles": {
				await buttonInteraction.deferUpdate();

				toSetPingRoles(buttonInteraction, id, giveawayManager);

				break;
			}

			case "editGiveaway": {
				// await buttonInteraction.deferUpdate();
				// Showing modal

				toEditGiveaway(buttonInteraction, id, giveawayManager);

				break;
			}

			case "managePrizes": {
				await buttonInteraction.deferUpdate();

				toManagePrizes(buttonInteraction, id, giveawayManager);

				break;
			}

			case "endGiveaway": {
				await buttonInteraction.deferUpdate();

				toEndGiveaway(buttonInteraction, id, giveawayManager);

				break;
			}

			case "resetData": {
				await buttonInteraction.deferUpdate();

				toResetData(buttonInteraction, id, giveawayManager);

				break;
			}

			case "deleteGiveaway": {
				await buttonInteraction.deferUpdate();

				toDeleteGiveaway(buttonInteraction, id, giveawayManager);

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
}
