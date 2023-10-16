import { type ButtonInteraction, ButtonStyle, ComponentType, bold, underscore } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import { stripIndent, stripIndents } from "common-tags";
import toDashboard from "../giveaway-dashboard.js";
import components from "#components";
import { Emojis } from "#constants";
import { yesNo } from "#helpers";
import Logger from "#logger";

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
			embeds: [],
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

	const message = await interaction.editReply({
		components: rows,
		content: stripIndent`
			Select a reset level.

			## Level 4 - Wipe everything
			* Resets most of the options you can edit in the dashboard (excluding title, description, and winner quantity).
			* Resets entries, winners, and prizes. ${Emojis.Warn} Users will not be notified.
			* Unannounces the giveaway and any winners.
				 
			## Level 3 - Reset entries, winners, and prizes
			* Resets entries, winners, and prizes. ${Emojis.Warn} Users will not be notified.
			* Unannounces the giveaway and the winners.
				 
			## Level 2 - Reset entries and winners
			* Resets entries and winners. ${Emojis.Warn} They will not be notified.
			* Unannounces the winners, but ${underscore("not")} the giveaway.
				 
			## Level 1 - Reset most options
			* Resets most of the options you can edit in the dashboard (excluding title, description, and winner quantity)
			* Does ${underscore("not")} reset winners, entries, or prizes.
			* Unannounces the giveaway and the winners.
		`,
		embeds: [],
	});

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
		max: 2,
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
		await buttonInteraction.deferUpdate();

		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				collector.stop();

				break;
			}

			case components.buttons.resetLevel4.customId: {
				const accept = await yesNo({
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to wipe everything in giveaway ${giveaway.asRelId}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`,
					},
					filter: (index) => index.user.id === interaction.user.id,
					medium: interaction,
					noStyle: ButtonStyle.Secondary,
					yesStyle: ButtonStyle.Danger,
				});

				if (!accept) {
					await interaction.followUp({
						content: `Alright! Canceled resetting giveaway ${giveaway.asRelId}`,
						ephemeral: true,
					});

					void toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({
					all: true,
				});

				new Logger({ interaction, label: "GIVEAWAY" }).log(`Level 4 reset giveaway #${giveaway.id}`);

				await interaction.followUp({
					content: `${Emojis.Sparks} Done! Successfully wiped giveaway ${giveaway.asRelId}.`,
					ephemeral: true,
				});

				collector.stop();

				break;
			}

			case components.buttons.resetLevel3.customId: {
				const accept = await yesNo({
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to reset entries, winners, and prizes in giveaway ${giveaway.asRelId}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`,
					},
					filter: (index) => index.user.id === interaction.user.id,
					medium: interaction,
					noStyle: ButtonStyle.Secondary,
					yesStyle: ButtonStyle.Danger,
				});

				if (!accept) {
					await interaction.followUp({
						content: `Alright! Canceled resetting giveaway ${giveaway.asRelId}`,
						ephemeral: true,
					});

					void toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({
					entriesAndWinners: true,
					prizesAndWinners: true,
				});

				new Logger({ interaction, label: "GIVEAWAY" }).log(`Level 3 reset giveaway #${giveaway.id}`);

				await interaction.followUp({
					content: `${Emojis.Sparks} Done! Successfully reset entries, winners, and prizes in giveaway ${giveaway.asRelId}.`,
					ephemeral: true,
				});

				collector.stop();

				break;
			}

			case components.buttons.resetLevel2.customId: {
				const accept = await yesNo({
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to reset entries and winners in giveaway ${giveaway.asRelId}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`,
					},
					filter: (index) => index.user.id === interaction.user.id,
					medium: interaction,
					noStyle: ButtonStyle.Secondary,
					yesStyle: ButtonStyle.Danger,
				});

				if (!accept) {
					await interaction.followUp({
						content: `Alright! Canceled resetting giveaway ${giveaway.asRelId}`,
						ephemeral: true,
					});

					void toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({ entriesAndWinners: true });

				new Logger({ interaction, label: "GIVEAWAY" }).log(`Level 2 reset giveaway #${giveaway.id}`);

				await interaction.followUp({
					content: `${Emojis.Sparks} Done! Successfully reset entries and winners in giveaway ${giveaway.asRelId}.`,
					ephemeral: true,
				});

				collector.stop();

				break;
			}

			case components.buttons.resetLevel1.customId: {
				const accept = await yesNo({
					data: {
						content: stripIndents`
							${Emojis.Warn} You are about to reset most options in giveaway ${giveaway.asRelId}.
							
							Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
						`,
					},
					filter: (index) => index.user.id === interaction.user.id,
					medium: interaction,
					noStyle: ButtonStyle.Secondary,
					yesStyle: ButtonStyle.Danger,
				});

				if (!accept) {
					await interaction.followUp({
						content: `Alright! Canceled resetting giveaway ${giveaway.asRelId}`,
						ephemeral: true,
					});

					void toDashboard(interaction, id);

					break;
				}

				await giveaway.reset({ options: true });

				new Logger({ interaction, label: "GIVEAWAY" }).log(`Level 1 reset giveaway #${giveaway.id}`);

				await interaction.followUp({
					content: `${Emojis.Sparks} Done! Successfully reset most options in giveaway ${giveaway.asRelId}.`,
					ephemeral: true,
				});

				collector.stop();

				break;
			}
		}
	});

	collector.on("end", async () => toDashboard(interaction, id));
}
