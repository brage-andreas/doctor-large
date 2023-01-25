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

	const {
		publishingOptions,
		publishGiveaway,
		unlockEntries,
		lockEntries,
		setEndDate,
		setRequiredRoles,
		setPingRoles,
		managePrizes,
		edit,
		endGiveaway,
		resetData,
		deleteGiveaway
	} = components.buttons;

	const publishButton = giveaway.publishedMessageId
		? publishingOptions.component()
		: publishGiveaway.component();

	const lockEntriesButton = giveaway.entriesLocked
		? unlockEntries.component()
		: lockEntries.component();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishButton,
		lockEntriesButton,
		setEndDate.component().setDisabled(true),
		setRequiredRoles.component(),
		setPingRoles.component()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		managePrizes.component(),
		edit.component(),
		endGiveaway.component(),
		resetData.component(),
		deleteGiveaway.component()
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
			case publishGiveaway.customId: {
				await buttonInteraction.deferUpdate();

				toPublishGiveaway(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case publishingOptions.customId: {
				await buttonInteraction.deferUpdate();

				toPublishingOptions(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case lockEntries.customId: {
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

			case unlockEntries.customId: {
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

			case setEndDate.customId: {
				await buttonInteraction.deferUpdate();

				toSetEndDate(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case setRequiredRoles.customId: {
				await buttonInteraction.deferUpdate();

				toSetRequiredRoles(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case setPingRoles.customId: {
				await buttonInteraction.deferUpdate();

				toSetPingRoles(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case edit.customId: {
				// await buttonInteraction.deferUpdate();
				// Showing modal

				toEditGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case managePrizes.customId: {
				await buttonInteraction.deferUpdate();

				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case endGiveaway.customId: {
				await buttonInteraction.deferUpdate();

				toEndGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case resetData.customId: {
				await buttonInteraction.deferUpdate();

				toResetData(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case deleteGiveaway.customId: {
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
