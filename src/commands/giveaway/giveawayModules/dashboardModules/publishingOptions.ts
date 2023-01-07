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

export default async function toPublishingOptions(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
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
		giveawayComponents.dashboard.backButton(),
		giveawayComponents.dashboard.lastChannelButton(),
		giveawayComponents.dashboard.editCurrentMessageButton(),
		giveawayComponents.dashboard.recallCurrentMessageButton()
	);

	const logger = new Logger({ prefix: "GIVEAWAY", interaction });

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

		if (
			componentInteraction.customId === "channelSelect" ||
			componentInteraction.customId === "lastChannel"
		) {
			const channelId = !componentInteraction.isChannelSelectMenu()
				? giveaway.channelId
				: componentInteraction.values[0];

			if (!channelId) {
				interaction.editReply({
					content: `${EMOJIS.WARN} Something went wrong. Try again.`,
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

			const message = await channel.send({
				allowedMentions: { roles: [...giveaway.pingRolesIds] },
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						giveawayComponents.dashboard.enterGiveawayButton(id)
					)
				],
				content: [...giveaway.pingRolesIds]
					.map((roleId) => `<@&${roleId}>`)
					.join(" "),
				embeds: [giveaway.toEmbed()]
			});

			const oldChannel = interaction.guild.channels.cache.get(
				giveaway.channelId ?? ""
			);

			if (oldChannel?.isTextBased() && giveaway.publishedMessageId) {
				oldChannel.messages
					.delete(giveaway.publishedMessageId)
					.catch(() => null);
			}

			interaction.followUp({
				components: [],
				ephemeral: true,
				content: stripIndents`
					${EMOJIS.SPARKS} Done! Giveaway published in ${channel}.
					
					Here is a [link to your now perfected giveaway](<${message.url}>).
				`,
				embeds: []
			});

			logger.log(
				`Republished giveaway #${giveaway.id} in ${channel.name} (${channelId})`
			);

			giveawayManager.edit({
				where: {
					id: giveaway.id
				},
				data: {
					publishedMessageId: message.id,
					channelId,
					...lastEditBy(interaction.user)
				}
			});
		}

		if (
			componentInteraction.customId === "editCurrent" ||
			componentInteraction.customId === "recallCurrent"
		) {
			if (!giveaway.channelId || !giveaway.publishedMessageId) {
				componentInteraction.followUp({
					content: `${EMOJIS.WARN} The giveaway has not been published yet.`,
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
						${EMOJIS.WARN} I cannot find channel: ${giveaway.channelId} (${giveaway.channelId}).
						Maybe it has it been deleted?
					`
				);

				return;
			}

			if (!channel.isTextBased()) {
				await componentInteraction.deferUpdate();

				retry(
					stripIndents`
						${EMOJIS.WARN} The channel is not a text channel: ${giveaway.channelId} (${giveaway.channelId}).
						I don't know how this happened.
					`
				);

				return;
			}

			const isEdit = componentInteraction.customId === "editCurrent";

			const content = giveaway.pingRolesMentions?.join(" ");

			const embeds = [giveaway.toEmbed()];

			const components = [
				new ActionRowBuilder<ButtonBuilder>().setComponents(
					giveawayComponents.dashboard.enterGiveawayButton(id)
				)
			];

			const successOrURL = isEdit
				? await channel.messages
						.edit(giveaway.publishedMessageId, {
							allowedMentions: {
								roles: [...giveaway.pingRolesIds]
							},
							components,
							content,
							embeds
						})
						.then((msg) => msg.url)
						.catch(() => null)
				: await channel.messages
						.delete(giveaway.publishedMessageId)
						.then(() => true)
						.catch(() => null);

			if (isEdit) {
				interaction.followUp({
					components: [],
					ephemeral: true,
					content: successOrURL
						? stripIndents`
							${EMOJIS.SPARKS} Done! Giveaway has been edited in ${channel}.
							
							Here is a [link to your now perfected giveaway](<${successOrURL}>).
						`
						: `${EMOJIS.WARN} I could not edit the message. Maybe it has been deleted?`,
					embeds: []
				});

				if (successOrURL) {
					logger.log(
						`Edited giveaway #${giveaway.id} in ${channel.name} (${channel.id})`
					);
				}
			} else {
				interaction.followUp({
					components: [],
					ephemeral: true,
					content: successOrURL
						? `${EMOJIS.SPARKS} Done! Giveaway has been recalled from ${channel}. All data remain intact.`
						: `${EMOJIS.WARN} I could not recall the Giveaway. The message might have already been deleted.`,
					embeds: []
				});

				if (successOrURL) {
					logger.log(
						`Recalled giveaway #${giveaway.id} from ${channel.name} (${channel.id})`
					);
				}
			}

			if (successOrURL) {
				giveawayManager.edit({
					where: {
						id: giveaway.id
					},
					data: {
						publishedMessageId: isEdit
							? giveaway.publishedMessageId
							: null,
						...lastEditBy(interaction.user)
					}
				});
			}

			toDashboard(interaction, id);
		}
	};

	retry();
}
