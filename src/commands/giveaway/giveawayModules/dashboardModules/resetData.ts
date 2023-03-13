import components from "#components";
import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import yesNo from "#helpers/yesNo.js";
import Logger from "#logger";
import { stripIndent, stripIndents } from "common-tags";
import {
	bold,
	ButtonStyle,
	ComponentType,
	underscore,
	type ButtonInteraction
} from "discord.js";
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
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const rows = components.createRows(
		components.buttons.back,
		components.buttons.resetLevel4,
		components.buttons.resetLevel3,
		components.buttons.resetLevel2,
		components.buttons.resetLevel1
	);

	const msg = await interaction.editReply({
		components: rows,
		content: stripIndent`
			Select a reset level.

			Level 4 - ${bold("Wipe everything")}
			→ Resets most of the options you can edit in the dashboard.
			    (Excluding title, description, and winner quantity)
			→ Resets entries, winners, and prizes. ${Emojis.Warn} They will not be notified.
			→ Unpublishes the giveaway and the winners.
				 
			Level 3 - ${bold("Reset entries, winners, and prizes")}
			→ Resets entries, winners, and prizes. ${Emojis.Warn} They will not be notified.
			→ Unpublishes the giveaway and the winners.
				 
			Level 2 - ${bold("Reset entries and winners")}
			→ Resets entries and winners. ${Emojis.Warn} They will not be notified.
			→ Unpublishes the winners, but ${underscore("not")} the giveaway.
				 
			Level 1 - ${bold("Reset most options")}
			→ Resets most of the options you can edit in the dashboard.
			    (Excluding title, description, and winner quantity)
			→ Does ${underscore("not")} reset winners, entries, or prizes.
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
			content: `${Emojis.NoEntry} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		await buttonInteraction.deferUpdate();

		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				collector.stop();

				break;
			}

			case components.buttons.resetLevel4.customId: {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: (i) => i.user.id === interaction.user.id,
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to wipe everything in giveaway #${
							giveaway.guildRelativeId
						}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`
					}
				});

				if (!accept) {
					await interaction.followUp({
						ephemeral: true,
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({
					all: true
				});

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 4 reset giveaway #${giveaway.id}`
				);

				await interaction.followUp({
					ephemeral: true,
					content: `${Emojis.Sparks} Done! Successfully wiped giveaway #${giveaway.guildRelativeId}.`
				});

				collector.stop();

				break;
			}

			case components.buttons.resetLevel3.customId: {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: (i) => i.user.id === interaction.user.id,
					data: {
						content: stripIndents`
							${
								Emojis.Warn
							} You are about to reset entries, winners, and prizes in giveaway #${
							giveaway.guildRelativeId
						}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`
					}
				});

				if (!accept) {
					await interaction.followUp({
						ephemeral: true,
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({
					entriesAndWinners: true,
					prizesAndWinners: true
				});

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 3 reset giveaway #${giveaway.id}`
				);

				await interaction.followUp({
					ephemeral: true,
					content: `${Emojis.Sparks} Done! Successfully reset entries, winners, and prizes in giveaway #${giveaway.guildRelativeId}.`
				});

				collector.stop();

				break;
			}

			case components.buttons.resetLevel2.customId: {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: (i) => i.user.id === interaction.user.id,
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to reset entries and winners in giveaway #${
							giveaway.guildRelativeId
						}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`
					}
				});

				if (!accept) {
					await interaction.followUp({
						ephemeral: true,
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({ entriesAndWinners: true });

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 2 reset giveaway #${giveaway.id}`
				);

				await interaction.followUp({
					ephemeral: true,
					content: `${Emojis.Sparks} Done! Successfully reset entries and winners in giveaway #${giveaway.guildRelativeId}.`
				});

				collector.stop();

				break;
			}

			case components.buttons.resetLevel1.customId: {
				const accept = await yesNo({
					yesStyle: ButtonStyle.Danger,
					noStyle: ButtonStyle.Secondary,
					medium: interaction,
					filter: (i) => i.user.id === interaction.user.id,
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to reset most options in giveaway #${
							giveaway.guildRelativeId
						}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`
					}
				});

				if (!accept) {
					await interaction.followUp({
						ephemeral: true,
						content: `Alright! Cancelled resetting giveaway #${giveaway.guildRelativeId}`
					});

					toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({ options: true });

				new Logger({ prefix: "GIVEAWAY", interaction }).log(
					`Level 1 reset giveaway #${giveaway.id}`
				);

				await interaction.followUp({
					ephemeral: true,
					content: `${Emojis.Sparks} Done! Successfully reset most options in giveaway #${giveaway.guildRelativeId}.`
				});

				collector.stop();

				break;
			}
		}
	});

	collector.on("end", async () => toDashboard(interaction, id));
}
