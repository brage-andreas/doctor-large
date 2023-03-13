import components from "#components";
import { Emojis } from "#constants";
import GiveawayManager from "#database/giveaway.js";
import { stripIndents } from "common-tags";
import { ComponentType, type RepliableInteraction } from "discord.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import toEditGiveaway from "./dashboardModules/editGiveaway.js";
import toEndOptions from "./dashboardModules/endOptions.js";
import toManagePrizes from "./dashboardModules/managePrizes.js";
import toPublishGiveaway from "./dashboardModules/publishGiveaway.js";
import toPublishingOptions from "./dashboardModules/publishingOptions.js";
import toResetData from "./dashboardModules/resetData.js";
import toSetPingRoles from "./dashboardModules/setPingRoles.js";
import toSetRequiredRoles from "./dashboardModules/setRequiredRoles.js";
import toEndedDashboard from "./endedGiveawayDashboard.js";

export default async function toDashboard(
	interaction: RepliableInteraction<"cached">,
	giveawayId: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild);
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
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
		? components.buttons.publishingOptions
		: components.buttons.publishGiveaway;

	const lockEntriesButton = giveaway.entriesLocked
		? components.buttons.unlockEntries
		: components.buttons.lockEntries;

	const rows = components.createRows(
		publishButton,
		components.buttons.endOptions,
		lockEntriesButton,
		components.buttons.setRequiredRoles,
		components.buttons.setPingRoles,
		components.buttons.managePrizes,
		components.buttons.edit,
		components.buttons.reset.component("data"),
		components.buttons.deleteGiveaway
	);

	const msg = await interaction.editReply({
		components: rows,
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
			content: `${Emojis.NoEntry} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		if (buttonInteraction.customId !== components.buttons.edit.customId) {
			await buttonInteraction.deferUpdate();
		}

		switch (buttonInteraction.customId) {
			case components.buttons.edit.customId: {
				toEditGiveaway(
					buttonInteraction,
					interaction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case components.buttons.publishGiveaway.customId: {
				toPublishGiveaway(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case components.buttons.publishingOptions.customId: {
				toPublishingOptions(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case components.buttons.lockEntries.customId: {
				await giveaway.edit({
					entriesLocked: true,
					nowOutdated: {
						publishedMessage: true
					}
				});

				toDashboard(buttonInteraction, giveawayId);

				break;
			}

			case components.buttons.unlockEntries.customId: {
				await giveaway.edit({
					entriesLocked: false,
					nowOutdated: {
						publishedMessage: true
					}
				});

				toDashboard(buttonInteraction, giveawayId);

				break;
			}

			case components.buttons.endOptions.customId: {
				toEndOptions(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.setRequiredRoles.customId: {
				toSetRequiredRoles(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case components.buttons.setPingRoles.customId: {
				toSetPingRoles(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.managePrizes.customId: {
				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.reset.customId: {
				toResetData(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.deleteGiveaway.customId: {
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
