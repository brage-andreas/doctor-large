import components from "#components";
import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import s from "#helpers/s.js";
import type GiveawayModule from "#modules/Giveaway.js";
import { source, stripIndents } from "common-tags";
import {
	AttachmentBuilder,
	ComponentType,
	type APIButtonComponentWithCustomId,
	type AutocompleteInteraction,
	type Interaction
} from "discord.js";
import toDashboard from "./dashboard.js";
import toDeleteGiveaway from "./dashboardModules/deleteGiveaway.js";
import { toAnnounceWinners } from "./endModules/announceWinners.js";
import { rollAndSign } from "./endModules/rollWinners/rollAndSign.js";

export default async function toEndedDashboard(
	interaction: Exclude<Interaction<"cached">, AutocompleteInteraction>,
	giveawayManager: GiveawayManager,
	giveawayOrId: GiveawayModule | number
) {
	const id =
		typeof giveawayOrId === "number" ? giveawayOrId : giveawayOrId.id;

	const giveaway = await giveawayManager.get(id);

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

	const announceWinnersButtons: Array<APIButtonComponentWithCustomId> = [];
	const rollWinnersButtons: Array<APIButtonComponentWithCustomId> = [];

	const unclaimedN = giveaway.winners.filter(
		({ claimed }) => !claimed
	).length;

	const noWinners = !giveaway.winners.length;
	const noUnclaimed = !unclaimedN;

	if (giveaway.winnersAreAnnounced()) {
		announceWinnersButtons.push(
			components.buttons.reannounceWinners.component(),
			components.buttons.unannounceWinners.component()
		);
	} else {
		announceWinnersButtons.push(
			components.buttons.announceWinners.component()
		);
	}

	if (noWinners) {
		rollWinnersButtons.push(components.buttons.rollWinners.component());
	} else {
		rollWinnersButtons.push(
			components.set.disabled(
				components.buttons.rerollWinners.component(unclaimedN),
				noUnclaimed
			),
			components.buttons.rerollAllWinners.component(
				giveaway.winners.length
			)
		);
	}

	const rows = components.createRows.specific(
		announceWinnersButtons.length + 1,
		rollWinnersButtons.length,
		2,
		2
	)(
		components.buttons.showAllWinners,
		...announceWinnersButtons,
		// ---
		...rollWinnersButtons,
		// ---
		components.set.disabled(
			components.buttons.deleteUnclaimedWinners,
			noUnclaimed
		),
		components.set.disabled(components.buttons.deleteAllWinners, noWinners),
		// ---
		components.buttons.reactivateGiveaway,
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
		await buttonInteraction.deferUpdate();

		switch (buttonInteraction.customId) {
			case components.buttons.reactivateGiveaway.customId: {
				await giveaway.edit({
					ended: false,
					nowOutdated: {
						announcementMessage: true
					}
				});

				toDashboard(buttonInteraction, giveaway.id);

				break;
			}

			case components.buttons.announceWinners.customId: {
				toAnnounceWinners(buttonInteraction, giveaway.id);

				break;
			}

			case components.buttons.reannounceWinners.customId: {
				toAnnounceWinners(buttonInteraction, giveaway.id);

				break;
			}

			case components.buttons.unannounceWinners.customId: {
				const channel = giveaway.channel;

				if (!channel) {
					await interaction.editReply({
						content: stripIndents`
							${Emojis.Warn} The channel the giveaway was announced in does not exist, or is not a valid channel.
							Try again or reannounce the giveaway in a new channel.

							Current channel: <#${giveaway.channelId}> (${giveaway.channelId}).
						`,
						components: [],
						embeds: []
					});

					break;
				}

				await giveaway.winnerMessage?.delete();

				await giveaway.edit({
					winnerMessageId: null,
					nowOutdated: {
						winnerMessage: false
					}
				});

				await interaction.editReply({
					content: stripIndents`
							${Emojis.Check} The winners are no longer announced. 
						`,
					components: [],
					embeds: []
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.deleteGiveaway.customId: {
				toDeleteGiveaway(
					buttonInteraction,
					giveaway.id,
					giveawayManager
				);

				break;
			}

			case components.buttons.showAllWinners.customId: {
				const members = await interaction.guild.members.fetch();

				const string = giveaway.prizes
					.map((prize, i, { length }) => {
						const pI = (i + 1)
							.toString()
							.padStart(length.toString().length, "0");

						const winners = prize.winners.map(
							(data, i, { length }) => {
								const member = members.get(data.userId);
								const userTag =
									member?.user.tag ?? "Unknown user";

								const wI = (i + 1)
									.toString()
									.padStart(length.toString().length, "0");

								const claimedStr = data.claimed
									? "Claimed"
									: "Not claimed";

								const time = data.createdAt.toLocaleString(
									"en-GB",
									{
										dateStyle: "medium",
										timeStyle: "medium",
										timeZone: "UTC"
									}
								);

								return `* ${wI} ${userTag} - ${claimedStr}. Won at ${time} UTC`;
							}
						);

						const wN = winners.length;

						return source`
							${pI} ${prize.name} (${wN}/${prize.quantity} ${s("winner", wN)})
							${" ".repeat(pI.length)} ${winners.join("\n")}
						`;
					})
					.join("\n\n");

				const data = Buffer.from(string);
				const attachment = new AttachmentBuilder(data).setName(
					`giveaway-${giveaway.asRelId}-winners.txt`
				);

				await interaction.followUp({
					ephemeral: true,
					files: [attachment]
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.rollWinners.customId:
			case components.buttons.rerollWinners.customId: {
				const prizes = await giveawayManager.getPrizes({
					giveawayId: giveaway.id,
					claimed: false
				});

				const entries = [...giveaway.entriesUserIds];
				const winnerQuantity = giveaway.winnerQuantity;
				const prizesQuantity = prizes.reduce(
					(acc, prize) => acc + prize.quantity,
					0
				);

				await rollAndSign({
					entries,
					giveaway,
					overrideClaimed: false,
					ignoreRequirements: false,
					prizes,
					prizesQuantity,
					winnerQuantity
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.rerollAllWinners.customId: {
				const entries = [...giveaway.entriesUserIds];
				const prizesQuantity = giveaway.prizesQuantity();
				const { winnerQuantity, prizes } = giveaway;

				await rollAndSign({
					entries,
					giveaway,
					overrideClaimed: true,
					ignoreRequirements: false,
					prizes,
					prizesQuantity,
					winnerQuantity
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.deleteUnclaimedWinners.customId: {
				await giveawayManager.deleteWinners(giveaway.data, {
					onlyDeleteUnclaimed: true
				});

				toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.deleteAllWinners.customId: {
				await giveawayManager.deleteWinners(giveaway.data);

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
