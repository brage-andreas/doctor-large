import { type WinnerData } from "@prisma/client";
import { source, stripIndents } from "common-tags";
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
	giveawayOrId: Giveaway | number
) {
	const id =
		typeof giveawayOrId === "number" ? giveawayOrId : giveawayOrId.id;

	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const buttonArray: Array<ButtonBuilder> = [];

	if (giveaway.winnersArePublished()) {
		buttonArray.push(
			components.buttons.republishWinners(),
			components.buttons.unpublishWinners()
		);
	} else {
		buttonArray.push(components.buttons.publishWinners());
	}

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		...buttonArray,
		components.buttons.showAllWinners()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		components.buttons.rerollWinners(),
		components.buttons.rerollAllWinners()
	);

	const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		components.buttons.reactivateGiveaway(),
		components.buttons.deleteGiveaway()
	);

	const msg = await interaction.editReply({
		components: [row1, row2, row3],
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

				return toDashboard(buttonInteraction, giveaway.id);
			}

			case "publishWinners": {
				return void publishWinners(buttonInteraction, giveaway.id);
			}

			case "republishWinners": {
				return void publishWinners(buttonInteraction, giveaway.id);
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

				return toEndedDashboard(interaction, giveawayManager, giveaway);
			}

			case "deleteGiveaway": {
				return toDeleteGiveaway(
					buttonInteraction,
					giveaway.id,
					giveawayManager
				);
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

				const members = await interaction.guild.members.fetch();

				const string = [...prizesSortedByWinners.entries()]
					.map(([userId, winnerData]) => {
						const member = members.get(userId);
						const userTag = member?.user.tag ?? "Unknown user";

						const string = winnerData
							.map((data) => {
								const {
									accepted,
									createdAt,
									prizeId,
									quantityWon
								} = data;

								const prize = giveaway.prizes.find(
									(prize) => prize.id === prizeId
								);

								const claimed = accepted
									? "Accepted"
									: "Not accepted";

								const name =
									prize?.name ?? `Unknown prize (${prizeId})`;

								const n = prize?.quantity
									? `${quantityWon}/${prize.quantity}`
									: quantityWon;

								const time = createdAt.toLocaleString("en-GB", {
									dateStyle: "medium",
									timeStyle: "long",
									timeZone: "UTC"
								});

								return `→ ${n} ${name} - ${claimed}, won at ${time}`;
							})
							.join("\n  →");

						return source`
							${userTag} (${userId})
							  ${string}
						`;
					})
					.join("\n\n");

				const data = Buffer.from(string);
				const attachment = new AttachmentBuilder(data).setName(
					`giveaway-#${giveaway.guildRelativeId}-winners.txt`
				);

				await interaction.followUp({
					ephemeral: true,
					files: [attachment]
				});

				return toEndedDashboard(interaction, giveawayManager, giveaway);
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

				return toEndedDashboard(interaction, giveawayManager, giveaway);
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

				return toEndedDashboard(interaction, giveawayManager, giveaway);
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
