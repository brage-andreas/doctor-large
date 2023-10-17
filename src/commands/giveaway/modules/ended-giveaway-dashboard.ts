import {
	type APIButtonComponentWithCustomId,
	AttachmentBuilder,
	type AutocompleteInteraction,
	ComponentType,
	type Interaction,
} from "discord.js";
import { rollAndSign } from "./end-modules/roll-winners/roll-and-sign.js";
import toDeleteGiveaway from "./dashboard/modules/delete-giveaway.js";
import { toAnnounceWinners } from "./end-modules/announce-winners.js";
import type GiveawayManager from "#database/giveaway.js";
import type GiveawayModule from "#modules/giveaway.js";
import toDashboard from "./dashboard/dashboard.js";
import { source, stripIndents } from "common-tags";
import components from "#discord-components";
import { Emojis } from "#constants";
import { s } from "#helpers";

export default async function toEndedDashboard(
	interaction: Exclude<Interaction<"cached">, AutocompleteInteraction>,
	giveawayManager: GiveawayManager,
	giveawayOrId: GiveawayModule | number
) {
	const id = typeof giveawayOrId === "number" ? giveawayOrId : giveawayOrId.id;

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

	const announceWinnersButtons: Array<APIButtonComponentWithCustomId> = [];
	const rollWinnersButtons: Array<APIButtonComponentWithCustomId> = [];

	const unclaimedN = giveaway.winners.filter(({ claimed }) => !claimed).length;

	const noWinners = giveaway.winners.length === 0;
	const noUnclaimed = !unclaimedN;

	if (giveaway.winnersAreAnnounced()) {
		announceWinnersButtons.push(
			components.buttons.reannounceWinners.component(),
			components.buttons.unannounceWinners.component()
		);
	} else {
		announceWinnersButtons.push(components.buttons.announceWinners.component());
	}

	if (noWinners) {
		rollWinnersButtons.push(components.buttons.rollWinners.component());
	} else {
		rollWinnersButtons.push(
			components.set.disabled(components.buttons.rerollWinners.component(unclaimedN), noUnclaimed),
			components.buttons.rerollAllWinners.component(giveaway.winners.length)
		);
	}

	const rows = components.createRows.specific(announceWinnersButtons.length + 1, rollWinnersButtons.length, 2, 2)(
		components.buttons.showAllWinners,
		...announceWinnersButtons,
		// ---
		...rollWinnersButtons,
		// ---
		components.set.disabled(components.buttons.deleteUnclaimedWinners, noUnclaimed),
		components.set.disabled(components.buttons.deleteAllWinners, noWinners),
		// ---
		components.buttons.reactivateGiveaway,
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
		await buttonInteraction.deferUpdate();

		switch (buttonInteraction.customId) {
			case components.buttons.reactivateGiveaway.customId: {
				await giveaway.edit({
					ended: false,
					nowOutdated: {
						announcementMessage: true,
					},
				});

				void toDashboard(buttonInteraction, giveaway.id);

				break;
			}

			case components.buttons.announceWinners.customId: {
				void toAnnounceWinners(buttonInteraction, giveaway.id);

				break;
			}

			case components.buttons.reannounceWinners.customId: {
				void toAnnounceWinners(buttonInteraction, giveaway.id);

				break;
			}

			case components.buttons.unannounceWinners.customId: {
				const channel = giveaway.channel;

				if (!channel) {
					await interaction.editReply({
						components: [],
						content: stripIndents`
							${Emojis.Warn} The channel the giveaway was announced in does not exist, or is not a valid channel.
							Try again or reannounce the giveaway in a new channel.

							Current channel: <#${giveaway.channelId}> (${giveaway.channelId}).
						`,
						embeds: [],
					});

					break;
				}

				await giveaway.winnerMessage?.delete();

				await giveaway.edit({
					nowOutdated: {
						winnerMessage: false,
					},
					winnerMessageId: null,
				});

				await interaction.editReply({
					components: [],
					content: stripIndents`
							${Emojis.Check} The winners are no longer announced. 
						`,
					embeds: [],
				});

				void toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.deleteGiveaway.customId: {
				void toDeleteGiveaway(buttonInteraction, giveaway.id, giveawayManager);

				break;
			}

			case components.buttons.showAllWinners.customId: {
				const members = await interaction.guild.members.fetch();

				const string = giveaway.prizes
					.map((prize, index, { length }) => {
						const pI = (index + 1).toString().padStart(length.toString().length, "0");

						const winners = prize.winners.map((data, index, { length }) => {
							const member = members.get(data.userId);
							const userTag = member?.user.tag ?? "Unknown user";

							const wI = (index + 1).toString().padStart(length.toString().length, "0");

							const claimedString = data.claimed ? "Claimed" : "Not claimed";

							const time = data.createdAt.toLocaleString("en-GB", {
								dateStyle: "medium",
								timeStyle: "medium",
								timeZone: "UTC",
							});

							return `* ${wI} ${userTag} - ${claimedString}. Won at ${time} UTC`;
						});

						const wN = winners.length;

						return source`
							${pI} ${prize.name} (${wN}/${prize.quantity} ${s("winner", wN)})
							${" ".repeat(pI.length)} ${winners.join("\n")}
						`;
					})
					.join("\n\n");

				const data = Buffer.from(string);
				const attachment = new AttachmentBuilder(data).setName(`giveaway-${giveaway.asRelId}-winners.txt`);

				await interaction.followUp({
					ephemeral: true,
					files: [attachment],
				});

				void toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.rollWinners.customId:
			case components.buttons.rerollWinners.customId: {
				const prizes = await giveawayManager.getPrizes({
					claimed: false,
					giveawayId: giveaway.id,
				});

				const entries = [...giveaway.entriesUserIds];
				const winnerQuantity = giveaway.winnerQuantity;
				const prizesQuantity = prizes.reduce((accumulator, prize) => accumulator + prize.quantity, 0);

				await rollAndSign({
					entries,
					giveaway,
					ignoreRequirements: false,
					overrideClaimed: false,
					prizes,
					prizesQuantity,
					winnerQuantity,
				});

				void toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.rerollAllWinners.customId: {
				const entries = [...giveaway.entriesUserIds];
				const prizesQuantity = giveaway.prizesQuantity();
				const { prizes, winnerQuantity } = giveaway;

				await rollAndSign({
					entries,
					giveaway,
					ignoreRequirements: false,
					overrideClaimed: true,
					prizes,
					prizesQuantity,
					winnerQuantity,
				});

				void toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.deleteUnclaimedWinners.customId: {
				await giveawayManager.deleteWinners(giveaway.data, {
					onlyDeleteUnclaimed: true,
				});

				void toEndedDashboard(interaction, giveawayManager, giveaway);

				break;
			}

			case components.buttons.deleteAllWinners.customId: {
				await giveawayManager.deleteWinners(giveaway.data);

				void toEndedDashboard(interaction, giveawayManager, giveaway);

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
