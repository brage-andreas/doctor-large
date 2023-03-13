import components from "#components";
import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import {
	hideLinkEmbed,
	hyperlink,
	PermissionFlagsBits,
	type ButtonInteraction,
	type ComponentType,
	type NewsChannel,
	type TextChannel
} from "discord.js";
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
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
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

	const rows = components.createRows(
		components.selects.channelSelect,
		components.buttons.back,
		components.buttons.lastChannel,
		components.buttons.editCurrentMessage,
		components.buttons.recallCurrentMessage
	);

	const logger = new Logger({ prefix: "GIVEAWAY", interaction });

	const retry = async (message?: string) => {
		if (message) {
			interaction.followUp({ content: message, ephemeral: true });
		}

		const updateMsg = await interaction.editReply({
			content: chooseChannelStr,
			components: rows,
			embeds: [giveaway.toEmbed()]
		});

		const componentInteraction = await updateMsg.awaitMessageComponent<
			ComponentType.Button | ComponentType.ChannelSelect
		>({
			filter: (i) => i.user.id === interaction.user.id
		});

		if (
			componentInteraction.customId === components.buttons.back.customId
		) {
			await componentInteraction.deferUpdate();

			toDashboard(interaction, id);

			return;
		}

		if (
			componentInteraction.customId ===
				components.selects.channelSelect.customId ||
			componentInteraction.customId ===
				components.buttons.lastChannel.customId
		) {
			await componentInteraction.deferUpdate();

			const channelId = !componentInteraction.isChannelSelectMenu()
				? giveaway.channelId
				: componentInteraction.values[0];

			if (!channelId) {
				interaction.editReply({
					content: `${Emojis.Warn} Something went wrong. Try again.`,
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
				retry(`${Emojis.Warn} This channel does not exist.`);

				return;
			}

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
				retry(
					`${Emojis.Error} I am missing permissions to send messages in ${channel} (${channelId})`
				);

				return;
			}

			const message = await channel.send({
				allowedMentions: { parse: ["everyone", "roles"] },
				components: components.createRows(
					components.buttons.enterGiveaway.component(id)
				),
				content: giveaway.pingRolesMentions?.join(" "),
				embeds: [giveaway.toEmbed()]
			});

			await giveaway.publishedMessage?.delete();

			interaction.followUp({
				components: [],
				ephemeral: true,
				content: stripIndents`
					${Emojis.Sparks} Done! Giveaway published in ${channel}.
					
					Here is a ${hyperlink(
						"link to your now perfected giveaway",
						hideLinkEmbed(message.url)
					)}.
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
			componentInteraction.customId ===
				components.buttons.editCurrentMessage.customId ||
			componentInteraction.customId ===
				components.buttons.recallCurrentMessage.customId
		) {
			await componentInteraction.deferUpdate();

			if (!giveaway.channelId || !giveaway.publishedMessageId) {
				componentInteraction.followUp({
					content: `${Emojis.Warn} The giveaway has not been published yet.`,
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
						${Emojis.Warn} I cannot find channel: ${giveaway.channelId} (${giveaway.channelId}).
						Maybe it has it been deleted?
					`
				);

				return;
			}

			if (!channel.isTextBased()) {
				await componentInteraction.deferUpdate();

				retry(
					stripIndents`
						${Emojis.Warn} The channel is not a text channel: ${giveaway.channelId} (${giveaway.channelId}).
						I don't know how this happened.
					`
				);

				return;
			}

			const isEdit =
				componentInteraction.customId ===
				components.buttons.editCurrentMessage.customId;

			const content = giveaway.pingRolesMentions?.join(" ");

			const embeds = [giveaway.toEmbed()];

			const urlOrNull = isEdit
				? await channel.messages
						.edit(giveaway.publishedMessageId, {
							allowedMentions: {
								roles: [...giveaway.pingRolesIds]
							},
							components: components.createRows(
								components.buttons.enterGiveaway.component(id)
							),
							content,
							embeds
						})
						.then((msg) => msg.url)
						.catch(() => false)
				: await channel.messages
						.delete(giveaway.publishedMessageId)
						.then(() => true)
						.catch(() => false);

			if (isEdit) {
				interaction.followUp({
					components: [],
					ephemeral: true,
					content:
						urlOrNull && typeof urlOrNull === "string"
							? stripIndents`
								${Emojis.Sparks} Done! Giveaway has been edited in ${channel}.
								
								Here is a ${hyperlink(
									"link to your now perfected giveaway",
									hideLinkEmbed(urlOrNull)
								)}).
							`
							: `${Emojis.Warn} I could not edit the message. Maybe it has been deleted?`,
					embeds: []
				});

				if (urlOrNull) {
					logger.log(
						`Edited giveaway #${giveaway.id} in ${channel.name} (${channel.id})`
					);
				}
			} else {
				interaction.followUp({
					components: [],
					ephemeral: true,
					content: urlOrNull
						? `${Emojis.Sparks} Done! Giveaway has been recalled from ${channel}. All data remain intact.`
						: `${Emojis.Warn} I could not recall the Giveaway. The message might have already been deleted.`,
					embeds: []
				});

				if (urlOrNull) {
					logger.log(
						`Recalled giveaway #${giveaway.id} from ${channel.name} (${channel.id})`
					);
				}
			}

			if (urlOrNull) {
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
