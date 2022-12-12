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

export default async function toRepublishGiveaway(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return;
	}

	const channelSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("channelSelect")
		.setMinValues(1)
		.setMaxValues(1)
		.setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

	const chooseChannelStr = stripIndents`
			Select the channel you would like to publish the giveaway in.${
				giveaway.channelId
					? `\n\nPrevious channel: <#${giveaway.channelId}> (${giveaway.channelId})`
					: ""
			}
		`;

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		channelSelectMenu
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton(),
		giveawayComponents.dashboard.lastChannelButton(),
		giveawayComponents.dashboard.editCurrentMessageButton()
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

		if (
			componentInteraction.customId === "channelSelect" ||
			componentInteraction.customId === "lastChannel"
		) {
			const channelId = !componentInteraction.isChannelSelectMenu()
				? giveaway.channelId
				: componentInteraction.values[0];

			if (!channelId) {
				interaction.editReply({
					content: "⚠️ Something went wrong. Try again.",
					components: [],
					embeds: []
				});

				return;
			}

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

			const message = await channel.send({
				content: giveaway.rolesToPing
					.map((roleId) => `<@&${roleId}>`)
					.join(" "),
				allowedMentions: {
					roles: giveaway.rolesToPing
				},
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

			const oldChannel = interaction.guild.channels.cache.get(
				giveaway.channelId ?? ""
			);

			if (oldChannel?.isTextBased() && giveaway.messageId) {
				oldChannel.messages
					.delete(giveaway.messageId)
					.catch(() => null);
			}

			interaction.editReply({
				content: stripIndents`
					✨ Done! Giveaway published in ${channel}.

					Here is a [link to your now perfected giveaway](<${message.url}>).
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
					messageId: message.id,
					channelId
				}
			});
		}

		if (componentInteraction.customId === "editCurrent") {
			if (!giveaway.channelId || !giveaway.messageId) {
				componentInteraction.followUp({
					content: "The giveaway is not published yet!",
					ephemeral: true
				});

				return;
			}

			const channel = interaction.guild.channels.cache.get(
				giveaway.channelId
			);

			if (!channel) {
				await componentInteraction.deferUpdate();

				retry(
					stripIndents`
						⚠️ I cannot find channel: ${giveaway.channelId} (${giveaway.channelId}).
						Maybe it has it been deleted?
					`
				);

				return;
			}

			if (!channel.isTextBased()) {
				await componentInteraction.deferUpdate();

				retry(
					stripIndents`
						⚠️ The channel is not a text channel: ${giveaway.channelId} (${giveaway.channelId}).
						I don't know how this happened.
					`
				);

				return;
			}

			const message = await channel.messages
				.edit(giveaway.messageId, {
					content: giveaway.rolesToPing
						.map((roleId) => `<@&${roleId}>`)
						.join(" "),
					allowedMentions: {
						roles: giveaway.rolesToPing
					},
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
				})
				.catch(() => null);

			interaction.editReply({
				content: message
					? stripIndents`
						✨ Done! Giveaway has been edited in ${channel}.
						
						Here is a [link to your now perfected giveaway](<${message.url}>).
					`
					: "⚠️ I could not edit the message. Maybe it has been deleted?",
				components: [],
				embeds: []
			});

			if (message) {
				giveawayManager.edit({
					where: {
						giveawayId: giveaway.giveawayId
					},
					data: {
						lastEditedTimestamp: Date.now().toString(),
						lastEditedUserTag: interaction.user.tag,
						lastEditedUserId: interaction.user.id
					}
				});
			}
		}
	};

	retry();
}
