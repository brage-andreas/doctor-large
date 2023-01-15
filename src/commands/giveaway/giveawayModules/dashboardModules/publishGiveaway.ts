import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ChannelSelectMenuBuilder,
	ChannelType,
	PermissionFlagsBits,
	type ButtonBuilder,
	type ButtonInteraction,
	type GuildTextBasedChannel,
	type NewsChannel,
	type TextChannel
} from "discord.js";
import components from "../../../../components/index.js";
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

	const chooseChannelStr = stripIndents`
		Select the channel you would like to publish the giveaway in.

		${
			giveaway.channelId
				? `Previous channel: <#${giveaway.channelId}> (${giveaway.channelId})`
				: ""
		}
	`;

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		channelSelectMenu
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		components.buttons.back()
	);

	if (giveaway.channelId) {
		row2.addComponents(components.buttons.lastChannel());
	}

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

		await componentInteraction.deferUpdate();

		if (componentInteraction.customId === "back") {
			toDashboard(interaction, id);

			return;
		}

		if (
			componentInteraction.customId === "channelSelect" ||
			componentInteraction.customId === "prizesStr"
		) {
			let channel: GuildTextBasedChannel;

			if (componentInteraction.isChannelSelectMenu()) {
				const channelId = componentInteraction.values[0];
				const channel_ = interaction.guild.channels.cache.get(
					channelId
				) as NewsChannel | TextChannel | undefined;

				if (!channel_) {
					retry(`${EMOJIS.WARN} This channel does not exist.`);

					return;
				}

				channel = channel_;
			} else {
				const channel_ = giveaway.channel;

				if (!channel_) {
					retry(`${EMOJIS.WARN} This channel does not exist.`);

					return;
				}

				channel = channel_;
			}

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
				retry(
					`${EMOJIS.WARN} I am missing permissions to send messages in ${channel} (${channel.id})`
				);

				return;
			}

			const msg = await channel.send({
				allowedMentions: {
					parse: ["roles", "everyone"]
				},
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						components.buttons.enterGiveaway(id)
					)
				],
				content: giveaway.pingRolesMentions?.join(" "),
				embeds: [giveaway.toEmbed()]
			});

			await giveaway.edit(
				{
					publishedMessageId: msg.id,
					channelId: channel.id
				},
				{
					nowOutdated: {
						publishedMessage: false
					}
				}
			);

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Published giveaway #${id} in ${channel.name} (${channel.id})`
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
