import { stripIndent, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	type ButtonInteraction
} from "discord.js";
import { giveawayComponents } from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import yesNo from "../../../../helpers/yesNo.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toResetData(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.WARN} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const resetLevel4Button = new ButtonBuilder()
		.setCustomId("resetLevel4")
		.setLabel("Level 4")
		.setStyle(ButtonStyle.Danger);

	const resetLevel3Button = new ButtonBuilder()
		.setCustomId("resetLevel3")
		.setLabel("Level 3")
		.setStyle(ButtonStyle.Secondary);

	const resetLevel2Button = new ButtonBuilder()
		.setCustomId("resetLevel2")
		.setLabel("Level 2")
		.setStyle(ButtonStyle.Secondary);

	const resetLevel1Button = new ButtonBuilder()
		.setCustomId("resetLevel1")
		.setLabel("Level 1")
		.setStyle(ButtonStyle.Success);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton(),
		resetLevel4Button,
		resetLevel3Button,
		resetLevel2Button,
		resetLevel1Button
	);

	const msg = await interaction.editReply({
		components: [row],
		content: stripIndent`
			Select a reset level.

			Level 4 - **Wipe everything**
			→ Resets most of the options you can edit in the dashboard.
			    (Excluding title, description, and winner quantity)
			→ Resets entries, winners, and prizes. ${EMOJIS.WARN} No one will not be notified.
			→ Unpublishes the giveaway and the winners.
				 
			Level 3 - **Reset entries, winners, and prizes**
			→ Resets entries, winners, and prizes. ${EMOJIS.WARN} No one will not be notified.
			→ Unpublishes the giveaway and the winners.
				 
			Level 2 - **Reset entries and winners**
			→ Resets entries and winners. ${EMOJIS.WARN} No one will not be notified.
			→ Unpublishes the winners, but *not* the giveaway.
				 
			Level 1 - **Reset most options**
			→ Resets most of the options you can edit in the dashboard.
			    (Excluding title, description, and winner quantity)
			→ Does **not** reset winners, entries, or prizes.
			→ Unpublishes the giveaway and the winners.
		`,
		embeds: []
	});

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		max: 2
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
			case "back": {
				return collector.stop();
			}

			case "resetLevel4": {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: () => true,
					data: {
						content: stripIndents`
							${EMOJIS.DANGER} You are about to wipe everything in giveaway #${giveaway.guildRelativeId}.
							
							Are you sure? Absolutely sure? This action will be **irreversible**.
						`
					}
				});

				if (!accept) {
					interaction.followUp({
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					return toDashboard(interaction, id);
				}

				await giveaway.reset.all();

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 4 reset giveaway #${giveaway.id}`
				);

				interaction.followUp({
					ephemeral: true,
					content: `${EMOJIS.SPARKS} Done! Successfully wiped giveaway #${giveaway.guildRelativeId}.`
				});

				return collector.stop();
			}

			case "resetLevel3": {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: () => true,
					data: {
						content: stripIndents`
							${EMOJIS.DANGER} You are about to reset entries, winners, and prizes in giveaway #${giveaway.guildRelativeId}.
							
							Are you sure? Absolutely sure? This action will be **irreversible**.
						`
					}
				});

				if (!accept) {
					interaction.followUp({
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					return toDashboard(interaction, id);
				}

				await giveaway.reset.entriesAndWinners({ includePrizes: true });

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 3 reset giveaway #${giveaway.id}`
				);

				interaction.followUp({
					ephemeral: true,
					content: `${EMOJIS.SPARKS} Done! Successfully reset entries, winners, and prizes in giveaway #${giveaway.guildRelativeId}.`
				});

				return collector.stop();
			}

			case "resetLevel2": {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: () => true,
					data: {
						content: stripIndents`
							${EMOJIS.DANGER} You are about to reset entries and winners in giveaway #${giveaway.guildRelativeId}.
							
							Are you sure? Absolutely sure? This action will be **irreversible**.
						`
					}
				});

				if (!accept) {
					interaction.followUp({
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					return toDashboard(interaction, id);
				}

				await giveaway.reset.entriesAndWinners({ includePrizes: true });

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 2 reset giveaway #${giveaway.id}`
				);

				interaction.followUp({
					ephemeral: true,
					content: `${EMOJIS.SPARKS} Done! Successfully reset entries and winners in giveaway #${giveaway.guildRelativeId}.`
				});

				return collector.stop();
			}

			case "resetLevel1": {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: () => true,
					data: {
						content: stripIndents`
							${EMOJIS.DANGER} You are about to reset most options in giveaway #${giveaway.guildRelativeId}.
							
							Are you sure? Absolutely sure? This action will be **irreversible**.
						`
					}
				});

				if (!accept) {
					interaction.followUp({
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					return toDashboard(interaction, id);
				}

				await giveaway.reset.entriesAndWinners({ includePrizes: true });

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 1 reset giveaway #${giveaway.id}`
				);

				interaction.followUp({
					ephemeral: true,
					content: `${EMOJIS.SPARKS} Done! Successfully reset most options in giveaway #${giveaway.guildRelativeId}.`
				});

				return collector.stop();
			}
		}
	});

	collector.on("end", () => toDashboard(interaction, id));
}
