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
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toPublishGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction
			.followUp({
				ephemeral: true,
				content: stripIndents`
					${EMOJIS.ERROR} This giveaway has no prizes. Add some prizes, and try again.
					
					If the prize(s) are a secret, you can for example name the prize "Secret"
				`
			})
			.catch(() => null);

		return toDashboard(interaction, id);
	}

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
			content:
				"Select the channel you would like to publish the giveaway in.",
			components: [row1, row2],
			embeds: [giveaway.toEmbed()]
		});

		const componentInteraction = await updateMsg.awaitMessageComponent({
			filter: (i) => i.user.id === interaction.user.id
		});

		await componentInteraction.deferUpdate();

		if (componentInteraction.customId === "back") {
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
				retry(`${EMOJIS.WARN} This channel does not exist.`);

				return;
			}

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
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

			await giveaway.edit(
				{
					publishedMessageId: msg.id,
					channelId
				},
				{
					nowOutdated: {
						publishedMessage: false
					}
				}
			);

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
