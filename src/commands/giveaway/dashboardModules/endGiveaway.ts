import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction
} from "discord.js";
import type GiveawayManager from "../../../database/giveaway.js";
import lastEditBy from "../../../helpers/lastEdit.js";
import yesNo from "../../../helpers/yesNo.js";
import Logger from "../../../logger/logger.js";
import { publishWinners } from "../endModules/publishWinners.js";
import { rollWinners } from "../endModules/rollWinners.js";
import toDashboard from "../mod.dashboard.js";

export default async function toEndGiveaway(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

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

		return toDashboard(interaction, giveawayId);
	}

	if (!giveaway.channelId) {
		await interaction.editReply({
			components: [],
			content: "⚠️ The giveaway has never been published.",
			embeds: []
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(giveaway.channelId);

	if (!channel?.isTextBased()) {
		await interaction.editReply({
			components: [],
			embeds: [],
			content: "⚠️ This channel does not exist, or is not a text channel."
		});

		return;
	}

	const message =
		(channel?.isTextBased() &&
			(await channel.messages
				.fetch(giveaway.messageId ?? "")
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
			giveawayId
		},
		data: {
			active: false,
			lockEntries: true,
			...lastEditBy(interaction.user)
		}
	});

	new Logger({
		prefix: "GIVEAWAY",
		color: "red",
		interaction
	}).logInteraction(`Ended giveaway #${giveawayId}`);

	const winners = await rollWinners({
		giveawayManager,
		giveawayId,
		guild: interaction.guild
	});

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
				→ Entries are locked.
				→ Giveaway is no longer active.
				→ ${winners.length}/${giveaway.numberOfWinners} winners have been rolled.

				Do you want to publish the winners right away?
			`
		}
	});

	if (publishWinnersNow) {
		await publishWinners(interaction, giveawayId);

		return;
	}

	await toDashboard(interaction, giveawayId);
}
