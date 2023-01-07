import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	PermissionFlagsBits,
	type ButtonBuilder,
	type ButtonInteraction,
	type NewsChannel,
	type TextChannel
} from "discord.js";
import { giveawayComponents } from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import lastEditBy from "../../../../helpers/lastEdit.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toPublishGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const chooseChannelStr =
		"Select the channel you would like to publish the giveaway in.";

	const channelSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("channelSelect")
		.setMinValues(1)
		.setMaxValues(1)
		.setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		channelSelectMenu
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton()
	);

	const retry = async (message?: string) => {
		if (message) {
			interaction.followUp({ content: message, ephemeral: true });
		}

		const updateMsg = await interaction.editReply({
			content: chooseChannelStr,
			components: [row1, row2],
			embeds: [giveaway.toEmbed()]
		});

		const componentInteraction = await updateMsg.awaitMessageComponent({
			filter: (i) => i.user.id === interaction.user.id
		});

		if (componentInteraction.customId === "back") {
			await componentInteraction.deferUpdate();

			toDashboard(interaction, id);

			return;
		}

		if (componentInteraction.customId === "channelSelect") {
			if (!componentInteraction.isChannelSelectMenu()) {
				interaction.editReply({
					content: `${EMOJIS.WARN} Something went wrong. Try again.`,
					components: [],
					embeds: []
				});

				return;
			}

			const channelId = componentInteraction.values[0];
			const channel = interaction.guild.channels.cache.get(channelId) as
				| NewsChannel
				| TextChannel
				| undefined;

			if (!channel) {
				await componentInteraction.deferUpdate();

				retry(`${EMOJIS.WARN} This channel does not exist.`);

				return;
			}

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
				await componentInteraction.deferUpdate();

				retry(
					`${EMOJIS.WARN} I am missing permissions to send messages in ${channel} (${channelId})`
				);

				return;
			}

			const msg = await channel.send({
				embeds: [giveaway.toEmbed()],
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						giveawayComponents.dashboard.enterGiveawayButton(id)
					)
				]
			});

			await giveawayManager.edit({
				where: {
					id: giveaway.id
				},
				data: {
					publishedMessageId: msg.id,
					channelId,
					...lastEditBy(interaction.user)
				}
			});

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Published giveaway #${id} in ${channel.name} (${channelId})`
			);

			await interaction.followUp({
				components: [],
				ephemeral: true,
				content: stripIndents`
					${EMOJIS.SPARKS} Done! Giveaway published in ${channel}.

					Here is a [link to your shiny new giveaway](<${msg.url}>).
				`,
				embeds: []
			});

			toDashboard(interaction, id);
		}
	};

	retry();
}
