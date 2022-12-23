import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction
} from "discord.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import lastEditBy from "../../../../helpers/lastEdit.js";
import yesNo from "../../../../helpers/yesNo.js";
import Logger from "../../../../logger/logger.js";
import { publishWinners } from "../../endModules/publishWinners.js";
import { signWinners } from "../../endModules/rollWinners/signWinners.js";
import toDashboard from "../dashboard.js";

export default async function toEndGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	let content = `Are you sure you want to end giveaway #${giveaway.guildRelativeId}?`;

	if (giveaway.endTimestamp && Number(giveaway.endTimestamp) < Date.now()) {
		content += `\n\nThe giveaway is set to end ${
			Date.now() - Number(giveaway.endTimestamp)
		}`;
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
			content: "Alright! Ending the giveaway was canceled.",
			ephemeral: true
		});

		return toDashboard(interaction, id);
	}

	if (!giveaway.channelId) {
		await interaction.followUp({
			components: [],
			content: "⚠️ The giveaway has never been published.",
			embeds: []
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
