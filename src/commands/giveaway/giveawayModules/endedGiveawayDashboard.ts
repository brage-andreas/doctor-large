import { WinnerData } from "@prisma/client";
import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ComponentType,
	type AutocompleteInteraction,
	type ButtonBuilder,
	type Interaction
} from "discord.js";
import components from "../../../components/index.js";
import { EMOJIS } from "../../../constants.js";
import type GiveawayManager from "../../../database/giveaway.js";
import type Giveaway from "../../../modules/Giveaway.js";
import toDashboard from "./dashboard.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import { publishWinners } from "./endModules/publishWinners.js";
import { rollAndSign } from "./endModules/rollWinners/rollAndSign.js";

export default async function toEndedDashboard(
	interaction: Exclude<Interaction<"cached">, AutocompleteInteraction>,
	giveawayManager: GiveawayManager,
	giveaway: Giveaway
) {
	const publishOrUnpublishButton = giveaway.winnersArePublished()
		? components.buttons.republishWinners()
		: components.buttons.publishWinners();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishOrUnpublishButton,
		components.buttons.unpublishWinners(),
		components.buttons.showAllWinners(),
		components.buttons.rerollWinners(),
		components.buttons.rerollAllWinners()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		components.buttons.reactivateGiveaway(),
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
		await buttonInteraction.deferUpdate();

		switch (buttonInteraction.customId) {
			case "reactivate": {
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
				publishWinners(buttonInteraction, giveaway.id);

				break;
			}

			case "republishWinners": {
				publishWinners(buttonInteraction, giveaway.id);

				break;
			}

			case "unpublishWinners": {
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

			case "deleteGiveaway": {
				await toDeleteGiveaway(
					buttonInteraction,
					giveaway.id,
					giveawayManager
				);

				break;
			}

			case "showAllWinners": {
				const prizesSortedByWinners = giveaway.prizes.reduce(
					(map, prize) => {
						prize.winners.forEach((winnerData) => {
							const previousPrizes = map.get(winnerData.userId);

							map.set(
								winnerData.userId,
								previousPrizes?.length
									? [...previousPrizes, winnerData]
									: [winnerData]
							);
						});

						return map;
					},
					new Map<string, Array<WinnerData>>()
				);

				const data = Buffer.from();
				const attachment = new AttachmentBuilder().setName(
					`Giveaway #${giveaway.guildRelativeId} winners`
				);

				break;
			}

			case "rerollWinners": {
				const prizes = await giveawayManager.getPrizes({
					giveawayId: giveaway.id,
					winnerAccepted: false
				});

				const entries = [...giveaway.entriesUserIds];
				const winnerQuantity = giveaway.winnerQuantity;
				const prizesQuantity = prizes.reduce(
					(acc, prize) => acc + prize.quantity,
					0
				);

				await rollAndSign({
					giveawayManager,
					giveawayId: giveaway.id,
					entries,
					prizes,
					prizesQuantity,
					winnerQuantity,
					onlyUnclaimed: true
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case "rerollAllWinners": {
				const entries = [...giveaway.entriesUserIds];
				const prizesQuantity = giveaway.prizesQuantity();
				const { winnerQuantity, prizes } = giveaway;

				await rollAndSign({
					giveawayManager,
					giveawayId: giveaway.id,
					entries,
					prizes,
					prizesQuantity,
					winnerQuantity
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

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
