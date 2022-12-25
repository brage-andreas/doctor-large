import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction
} from "discord.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import lastEditBy from "../../../../helpers/lastEdit.js";
import s from "../../../../helpers/s.js";
import { timestamp } from "../../../../helpers/timestamps.js";
import yesNo from "../../../../helpers/yesNo.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";
import { publishWinners } from "../endModules/publishWinners.js";
import { signWinners } from "../endModules/rollWinners/signWinners.js";

export default async function toEndGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const prizesLen = giveaway.prizes.length;
	const prizesN = giveaway.prizes.reduce((acc, e) => acc + e.quantity, 0);
	const winnersN = giveaway.winnerQuantity;

	if (!prizesLen) {
		await interaction.followUp({
			ephemeral: true,
			content: stripIndents`
				⚠️ This giveaway has no prizes. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret"
			`
		});

		return toDashboard(interaction, id);
	}

	let content = stripIndents`
		Are you sure you want to end giveaway #${giveaway.guildRelativeId}?
	`;

	if (giveaway.endTimestamp) {
		const inFuture = Number(giveaway.endTimestamp) < Date.now();

		content += `The giveaway ${
			inFuture ? "is" : "was"
		} set to end ${timestamp(giveaway.endTimestamp, "R")}.`;
	}

	if (prizesN < winnersN) {
		content += `\n\n⚠️ There are not enough prizes for **${winnersN}** ${s(
			"winner",
			winnersN
		)}!`;

		content += ` There will be **${prizesN}** ${s(
			"winner",
			prizesN
		)} instead.`;
	}

	const confirmation = await yesNo({
		filter: (i) => i.user.id === interaction.user.id,
		yesStyle: ButtonStyle.Secondary,
		noStyle: ButtonStyle.Secondary,
		medium: interaction,
		time: 60_000,
		data: {
			components: [],
			content,
			embeds: []
		}
	});

	if (!confirmation) {
		await interaction.followUp({
			ephemeral: true,
			content: "Alright! Ending the giveaway was canceled."
		});

		return toDashboard(interaction, id);
	}

	if (!giveaway.channelId) {
		await interaction.followUp({
			ephemeral: true,
			content: "⚠️ The giveaway has never been published."
		});

		return toDashboard(interaction, id);
	}

	const channel = interaction.guild.channels.cache.get(giveaway.channelId);

	if (!channel?.isTextBased()) {
		await interaction.editReply({
			components: [],
			embeds: [],
			content:
				"⚠️ The channel the giveaway was published in does not exist. Republish it and try again."
		});

		return;
	}

	const message =
		(channel?.isTextBased() &&
			(await channel.messages
				.fetch(giveaway.publishedMessageId ?? "")
				.catch(() => null))) ||
		null;

	await message?.edit({
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("This giveaway has ended!")
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("giveaway-ended")
					.setDisabled(true)
			)
		]
	});

	await giveawayManager.edit({
		where: {
			id
		},
		data: {
			active: false,
			entriesLocked: true,
			...lastEditBy(interaction.user)
		}
	});

	new Logger({
		prefix: "GIVEAWAY",
		color: "red",
		interaction
	}).log(`Ended giveaway #${id}`);

	await signWinners({ giveawayId: giveaway.id, guild: interaction.guild });

	const winnerCount = await giveawayManager.getUniqueWinnerCount(giveaway.id);

	const publishWinnersNow = await yesNo({
		filter: (i) => i.user.id === interaction.user.id,
		yesStyle: ButtonStyle.Secondary,
		noStyle: ButtonStyle.Secondary,
		medium: interaction,
		time: 60_000,
		data: {
			components: [],
			embeds: [],
			content: stripIndents`
				Done! Giveaway #${giveaway.guildRelativeId} has ended.
				→ 🔒 Entries are locked.
				→ 🔴 Giveaway is not active.
				→ ${winnerCount}/${giveaway.winnerQuantity} winners have been rolled.

				Do you want to publish the winners right away?
			`
		}
	});

	if (publishWinnersNow) {
		await publishWinners(interaction, id);

		return;
	}

	await toDashboard(interaction, id);
}
