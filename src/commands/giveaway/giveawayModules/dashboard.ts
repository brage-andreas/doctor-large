import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	type AutocompleteInteraction,
	type ButtonBuilder,
	type Interaction
} from "discord.js";
import components from "../../../components/index.js";
import { EMOJIS } from "../../../constants.js";
import GiveawayManager from "../../../database/giveaway.js";
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
import toEndedDashboard from "./endedGiveawayDashboard.js";

export default async function toDashboard(
	interaction: Exclude<Interaction<"cached">, AutocompleteInteraction>,
	giveawayId: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild);
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (giveaway.ended) {
		await toEndedDashboard(interaction, giveawayManager, giveaway);

		return;
	}

	const publishButton = giveaway.publishedMessageId
		? components.buttons.publishingOptions()
		: components.buttons.publishGiveaway();

	const lockEntriesButton = giveaway.entriesLocked
		? components.buttons.unlockEntries()
		: components.buttons.lockEntries();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishButton,
		lockEntriesButton,
		components.buttons.setEndDate().setDisabled(true),
		components.buttons.setRequiredRoles(),
		components.buttons.setPingRoles()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		components.buttons.managePrizes(),
		components.buttons.editGiveaway(),
		components.buttons.endGiveaway(),
		components.buttons.resetData(),
		components.buttons.deleteGiveaway()
	);

	const msg = await interaction.editReply({
		components: [row1, row2],
		...giveaway.toDashboardOverview()
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

				await giveaway.edit(
					{
						entriesLocked: true
					},
					{
						nowOutdated: {
							publishedMessage: true
						}
					}
				);

				toDashboard(buttonInteraction, giveawayId);

				break;
			}

			case "unlockEntries": {
				await buttonInteraction.deferUpdate();

				await giveaway.edit(
					{
						entriesLocked: false
					},
					{
						nowOutdated: {
							publishedMessage: true
						}
					}
				);

				toDashboard(buttonInteraction, giveawayId);

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
}
