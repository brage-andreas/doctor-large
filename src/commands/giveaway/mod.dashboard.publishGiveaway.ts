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
import { giveawayComponents } from "../../components/index.js";
import type GiveawayManager from "../../database/giveaway.js";
import toDashboard from "./mod.dashboard.js";
import formatGiveaway from "./mod.formatGiveaway.js";

export default async function toPublishGiveaway(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

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
			embeds: [await formatGiveaway(giveaway, true, interaction.guild)]
		});

		const componentInteraction = await updateMsg.awaitMessageComponent({
			filter: (i) => i.user.id === interaction.user.id
		});

		if (componentInteraction.customId === "back") {
			await componentInteraction.deferUpdate();

			toDashboard(interaction, giveawayId);

			return;
		}

		if (componentInteraction.customId === "channelSelect") {
			if (!componentInteraction.isChannelSelectMenu()) {
				interaction.editReply({
					content: "⚠️ Something went wrong. Try again.",
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

				retry("⚠️ This channel does not exist.");

				return;
			}

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
				await componentInteraction.deferUpdate();

				retry(
					`⚠️ I am missing permissions to send messages in ${channel} (${channelId})`
				);

				return;
			}

			const msg = await channel.send({
				embeds: [
					await formatGiveaway(giveaway, true, interaction.guild)
				],
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						giveawayComponents.dashboard.enterGiveawayButton(
							giveawayId
						)
					)
				]
			});

			interaction.editReply({
				content: stripIndents`
					✨ Done! Giveaway published in ${channel}.

					Here is a **[link to your shiny new giveaway](<${msg.url}>)**.
				`,
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
	};

	retry();
}
