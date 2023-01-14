import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	type AutocompleteInteraction,
	type ButtonBuilder,
	type Interaction
} from "discord.js";
import { giveawayComponents } from "../../../components/index.js";
import { EMOJIS } from "../../../constants.js";
import type GiveawayManager from "../../../database/giveaway.js";
import type Giveaway from "../../../modules/Giveaway.js";
import toDashboard from "./dashboard.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import { publishWinners } from "./endModules/publishWinners.js";
import { signWinners } from "./endModules/rollWinners/signWinners.js";

export default async function toEndedDashboard(
	interaction: Exclude<Interaction<"cached">, AutocompleteInteraction>,
	giveawayManager: GiveawayManager,
	giveaway: Giveaway
) {
	const winnerButton = giveaway.winnersArePublished()
		? giveawayComponents.endedDashboard.republishWinnersButton()
		: giveawayComponents.endedDashboard.publishWinnersButton();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		winnerButton,
		giveawayComponents.endedDashboard.unpublishWinnersButton()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		giveawayComponents.endedDashboard.reactivateButton(),
		giveawayComponents.endedDashboard.deleteGiveawayButton()
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
			case "reactivate": {
				await buttonInteraction.deferUpdate();

				await giveaway.edit(
					{
						active: true
					},
					{
						nowOutdated: {
							publishedMessage: true
						}
					}
				);

				toDashboard(buttonInteraction, giveaway.id);

				break;
			}

			case "publishWinners": {
				await buttonInteraction.deferUpdate();

				publishWinners(buttonInteraction, giveaway.id);

				break;
			}

			case "republishWinners": {
				await buttonInteraction.deferUpdate();

				publishWinners(buttonInteraction, giveaway.id);

				break;
			}

			case "unpublishWinners": {
				await buttonInteraction.deferUpdate();

				const channel = giveaway.channel;

				if (!channel) {
					await interaction.editReply({
						content: stripIndents`
							${EMOJIS.WARN} The channel the giveaway was published in does not exist, or is not a valid channel.
							Try again or republish the giveaway in a new channel.

							Current channel: <#${giveaway.channelId}> (${giveaway.channelId}).
						`,
						components: [],
						embeds: []
					});

					break;
				}

				await giveaway.winnerMessage?.delete();

				await giveaway.edit(
					{
						winnerMessageId: null
					},
					{
						nowOutdated: {
							winnerMessage: false
						}
					}
				);

				await interaction.editReply({
					content: stripIndents`
							${EMOJIS.V} The winners are now unpublished. 
						`,
					components: [],
					embeds: []
				});

				break;
			}

			case "rerollWinners": {
				await buttonInteraction.deferUpdate();

				await signWinners({
					guild: interaction.guild,
					giveawayId: giveaway.id
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case "deleteGiveaway": {
				await buttonInteraction.deferUpdate();

				await toDeleteGiveaway(
					buttonInteraction,
					giveaway.id,
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
