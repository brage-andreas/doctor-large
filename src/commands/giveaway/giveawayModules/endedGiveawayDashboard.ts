import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	type ButtonInteraction,
	type CommandInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import { EMOJIS } from "../../../constants.js";
import type GiveawayManager from "../../../database/giveaway.js";
import formatGiveaway from "../../../helpers/formatGiveaway.js";
import lastEditBy from "../../../helpers/lastEdit.js";
import { type GiveawayWithIncludes } from "../../../typings/database.js";
import toDashboard from "./dashboard.js";
import { publishWinners } from "./endModules/publishWinners.js";
import { signWinners } from "./endModules/rollWinners/signWinners.js";

export default async function toEndedDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayManager: GiveawayManager,
	giveaway: GiveawayWithIncludes
) {
	const reactivateButton = new ButtonBuilder()
		.setCustomId("reactivate")
		.setLabel("Reactivate")
		.setStyle(ButtonStyle.Secondary);

	const publishWinnersButton = new ButtonBuilder()
		.setCustomId("publishWinners")
		.setLabel("Publish winners")
		.setStyle(ButtonStyle.Success);

	const republishWinnersButton = new ButtonBuilder()
		.setCustomId("republishWinners")
		.setLabel("Republish winners")
		.setStyle(ButtonStyle.Success);

	const unpublishWinnersButton = new ButtonBuilder()
		.setCustomId("unpublishWinners")
		.setLabel("Unpublish winners")
		.setStyle(ButtonStyle.Secondary);

	const winnerButton = giveaway.winnerMessageId
		? republishWinnersButton
		: publishWinnersButton;

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		winnerButton,
		unpublishWinnersButton
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		reactivateButton
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
		}
	});

	collector.on("end", (_, reason) => {
		if (reason !== "time") {
			return;
		}

		msg.edit({ components: [] }).catch(() => null);
	});
}
