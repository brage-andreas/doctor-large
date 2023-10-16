import toAnnouncementOptions from "./dashboardModules/announcementOptions.js";
import toAnnounceGiveaway from "./dashboardModules/announceGiveaway.js";
import toSetRequiredRoles from "./dashboardModules/setRequiredRoles.js";
import { ComponentType, type RepliableInteraction } from "discord.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import toEditGiveaway from "./dashboardModules/editGiveaway.js";
import toManagePrizes from "./dashboardModules/managePrizes.js";
import toSetPingRoles from "./dashboardModules/setPingRoles.js";
import toEndOptions from "./dashboardModules/endOptions.js";
import toEndedDashboard from "./endedGiveawayDashboard.js";
import toResetData from "./dashboardModules/resetData.js";
import GiveawayManager from "#database/giveaway.js";
import { stripIndents } from "common-tags";
import components from "#components";
import { Emojis } from "#constants";

export default async function toDashboard(interaction: RepliableInteraction<"cached">, giveawayId: number) {
	const giveawayManager = new GiveawayManager(interaction.guild);
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: [],
		});

		return;
	}

	if (giveaway.ended) {
		await toEndedDashboard(interaction, giveawayManager, giveaway);

		return;
	}

	const announceButton = giveaway.announcementMessageId
		? components.buttons.announcementOptions
		: components.buttons.announceGiveaway;

	const lockEntriesButton = giveaway.entriesLocked
		? components.buttons.unlockEntries
		: components.buttons.lockEntries;

	const rows = components.createRows(
		announceButton,
		components.buttons.endOptions,
		lockEntriesButton,
		components.buttons.setRequiredRoles,
		components.buttons.setPingRoles,
		components.buttons.managePrizes,
		components.buttons.edit,
		components.buttons.reset.component("data"),
		components.buttons.deleteGiveaway
	);

	const message = await interaction.editReply({
		components: rows,
		...giveaway.toDashboardOverview(),
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
		if (buttonInteraction.customId !== components.buttons.edit.customId) {
			await buttonInteraction.deferUpdate();
		}

		switch (buttonInteraction.customId) {
			case components.buttons.edit.customId: {
				void toEditGiveaway(buttonInteraction, interaction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.announceGiveaway.customId: {
				void toAnnounceGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.announcementOptions.customId: {
				void toAnnouncementOptions(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.lockEntries.customId: {
				await giveaway.edit({
					entriesLocked: true,
					nowOutdated: {
						announcementMessage: true,
					},
				});

				void toDashboard(buttonInteraction, giveawayId);

				break;
			}

			case components.buttons.unlockEntries.customId: {
				await giveaway.edit({
					entriesLocked: false,
					nowOutdated: {
						announcementMessage: true,
					},
				});

				void toDashboard(buttonInteraction, giveawayId);

				break;
			}

			case components.buttons.endOptions.customId: {
				void toEndOptions(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.setRequiredRoles.customId: {
				void toSetRequiredRoles(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.setPingRoles.customId: {
				void toSetPingRoles(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.managePrizes.customId: {
				void toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.reset.customId: {
				void toResetData(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case components.buttons.deleteGiveaway.customId: {
				void toDeleteGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}
		}
	});

	collector.on("end", (_, reason) => {
		if (reason !== "time") {
			return;
		}

		message.edit({ components: [] }).catch(() => null);
	});
}
