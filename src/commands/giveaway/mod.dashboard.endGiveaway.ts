import { oneLine, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction
} from "discord.js";
import type GiveawayManager from "../../database/giveaway.js";
import yesNo from "../../helpers/yesNo.js";
import publishWinners from "./endModules/publishWinners.js";
import { rollWinners } from "./endModules/rollWinners.js";
import toDashboard from "./mod.dashboard.js";

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
			content: "⚠️ The giveaway has never been published."
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(giveaway.channelId);

	if (!channel?.isTextBased()) {
		await interaction.editReply(
			"⚠️ This channel does not exist, or is not a text channel."
		);

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
		await publishWinners(channel, giveawayId);

		await interaction.editReply({
			content: oneLine`
				Done! Winners of giveaway
				#${giveaway.guildRelativeId}
				are published in ${channel}!
			`,
			components: [],
			embeds: []
		});

		return;
	}

	await toDashboard(interaction, giveawayId);
}
