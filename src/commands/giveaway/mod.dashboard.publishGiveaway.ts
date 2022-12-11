import { id } from "common-tags";
import {
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	type ButtonBuilder,
	type ButtonInteraction,
	type NewsChannel,
	type TextChannel
} from "discord.js";
import giveaway from "../../database/giveaway.js";
import formatGiveaway from "./mod.formatGiveaway.js";

export default async function (interaction: ButtonInteraction<"cached">) {
	if (!interaction.replied) {
		await interaction.deferUpdate().catch(console.error);
	}

	const channelSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("channelSelect")
		.setMinValues(1)
		.setMaxValues(1)
		.setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

	const chooseChannelStr =
		"Select the channel you would like to publish the giveaway in.";

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		channelSelectMenu
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		backButton
	);

	const updateMsg = await interaction.editReply({
		content: chooseChannelStr,
		components: [row1, row2],
		embeds: [await formatGiveaway(giveaway, true)]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	if (component.customId === "back") {
		dashboard(interaction, giveawayManager, id);

		return;
	}

	if (component.customId === "channelSelect") {
		if (!component.isChannelSelectMenu()) {
			interaction.editReply({
				content: "⚠️ Something went wrong. Try again.",
				components: [],
				embeds: []
			});

			return;
		}

		const channelId = component.values[0];
		const channel = interaction.guild.channels.cache.get(channelId) as
			| NewsChannel
			| TextChannel
			| undefined;

		if (!channel) {
			interaction.editReply({
				content: "⚠️ This channel does not exist.",
				components: [],
				embeds: []
			});

			return;
		}

		const msg = await channel.send({
			embeds: [await formatGiveaway(giveaway, true)],
			components: [
				new ActionRowBuilder<ButtonBuilder>().setComponents(
					enterGiveawayButton
				)
			]
		});

		interaction.editReply({
			content: `✨ Done! Giveaway published in ${channel}.`,
			components: [],
			embeds: []
		});

		giveawayManager.edit({
			where: {
				giveawayId: giveaway.giveawayId
			},
			data: {
				lastEditedTimestamp: Date.now().toString(),
				lastEditedUserTag: interaction.user.tag,
				lastEditedUserId: interaction.user.id,
				messageId: msg.id,
				channelId
			}
		});
	}

	return;
}
