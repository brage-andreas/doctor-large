import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	PermissionFlagsBits,
	type ButtonBuilder,
	type ButtonInteraction,
	type ChannelSelectMenuBuilder,
	type ComponentType,
	type NewsChannel,
	type TextChannel
} from "discord.js";
import components from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toPublishingOptions(
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

	const chooseChannelStr = stripIndents`
		Select the channel you would like to publish the giveaway in.

		${
			giveaway.channelId
				? `Previous channel: <#${giveaway.channelId}> (${giveaway.channelId})`
				: ""
		}
	`;

	const { channelSelect } = components.selects;
	const { back, lastChannel, editCurrentMessage, recallCurrentMessage } =
		components.buttons;

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		channelSelect.component()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		back.component(),
		lastChannel.component(),
		editCurrentMessage.component(),
		recallCurrentMessage.component()
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

		const componentInteraction = await updateMsg.awaitMessageComponent<
			ComponentType.Button | ComponentType.ChannelSelect
		>({
			filter: (i) => i.user.id === interaction.user.id
		});

		if (componentInteraction.customId === back.customId) {
			await componentInteraction.deferUpdate();

			toDashboard(interaction, id);

			return;
		}

		if (
			componentInteraction.customId === channelSelect.customId ||
			componentInteraction.customId === lastChannel.customId
		) {
			await componentInteraction.deferUpdate();

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
				retry(`${EMOJIS.WARN} This channel does not exist.`);

				return;
			}

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
				retry(
					`${EMOJIS.ERROR} I am missing permissions to send messages in ${channel} (${channelId})`
				);

				return;
			}

			const message = await channel.send({
				allowedMentions: { parse: ["everyone", "roles"] },
				components: [
					new ActionRowBuilder<ButtonBuilder>().setComponents(
						components.buttons.enterGiveaway.component(id)
					)
				],
				content: giveaway.pingRolesMentions?.join(" "),
				embeds: [giveaway.toEmbed()]
			});

			await giveaway.publishedMessage?.delete();

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

			giveaway.edit({
				publishedMessageId: message.id,
				channelId,
				nowOutdated: {
					publishedMessage: false
				}
			});
		}

		if (
			componentInteraction.customId === editCurrentMessage.customId ||
			componentInteraction.customId === recallCurrentMessage.customId
		) {
			await componentInteraction.deferUpdate();

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

			const isEdit =
				componentInteraction.customId === editCurrentMessage.customId;

			const content = giveaway.pingRolesMentions?.join(" ");

			const embeds = [giveaway.toEmbed()];

			const rows = [
				new ActionRowBuilder<ButtonBuilder>().setComponents(
					components.buttons.enterGiveaway.component(id)
				)
			];

			const successOrURL = isEdit
				? await channel.messages
						.edit(giveaway.publishedMessageId, {
							allowedMentions: {
								roles: [...giveaway.pingRolesIds]
							},
							components: rows,
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
				await giveaway.edit({
					publishedMessageId: isEdit
						? giveaway.publishedMessageId
						: null,
					nowOutdated: {
						publishedMessage: false
					}
				});

				toDashboard(componentInteraction, id);
			}
		}
	};

	retry();
}
