import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ComponentType,
	type ButtonInteraction,
	type CommandInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import { giveawayComponents } from "../../../components/index.js";
import { EMOJIS } from "../../../constants.js";
import type GiveawayManager from "../../../database/giveaway.js";
import lastEditBy from "../../../helpers/lastEdit.js";
import type Giveaway from "../../../modules/Giveaway.js";
import toDashboard from "./dashboard.js";
import { publishWinners } from "./endModules/publishWinners.js";
import { signWinners } from "./endModules/rollWinners/signWinners.js";

export default async function toEndedDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayManager: GiveawayManager,
	giveaway: Giveaway
) {
	const winnerButton = giveaway.winnerMessageId
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
		content: giveaway.toDashboardOverviewString(),
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
			content: `${EMOJIS.NO_ENTRY} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case "reactivate": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: {
						id: giveaway.id
					},
					data: {
						active: true,
						...lastEditBy(interaction.user)
					}
				});

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

				const channel = interaction.guild.channels.cache.get(
					giveaway.channelId ?? ""
				);

				if (!channel?.isTextBased()) {
					await interaction.editReply({
						content: stripIndents`
							${EMOJIS.WARN} The channel the giveaway was published in does not exist, or is not a valid channel.
							Try again or republish the giveaway in a new channel.
						`,
						components: [],
						embeds: []
					});

					break;
				}

				giveaway.winnerMessageId &&
					(await channel.messages
						.delete(giveaway.winnerMessageId)
						.catch(() => null));

				await giveawayManager.edit({
					where: {
						id: giveaway.id
					},
					data: {
						winnerMessageId: null,
						...lastEditBy(interaction.user)
					}
				});

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
				TODO;
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
