import { type ButtonInteraction, type ComponentType, type NewsChannel, type TextChannel } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import { oneLine, stripIndents } from "common-tags";
import toDashboard from "../giveaway-dashboard.js";
import { getMissingPermissions } from "#helpers";
import components from "#components";
import { Emojis } from "#constants";
import Logger from "#logger";

export default async function toAnnouncementOptions(
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
			embeds: [],
		});

		return;
	}

	const chooseChannelString = stripIndents`
		Select the channel you would like to announce the giveaway in.

		${giveaway.channel ? `Previous channel: ${giveaway.channel.toString()} (${giveaway.channel.id})` : ""}
	`;

	const rows = components.createRows(
		components.selectMenus.channel,
		components.buttons.back,
		components.buttons.lastChannel,
		components.buttons.editCurrentMessage,
		components.buttons.recallCurrentMessage
	);

	const logger = new Logger({ interaction, label: "GIVEAWAY" });

	const retry = async (message?: string) => {
		if (message) {
			interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
		}

		const updateMessage = await interaction.editReply({
			components: rows,
			content: chooseChannelString,
			embeds: [giveaway.toEmbed()],
		});

		const componentInteraction = await updateMessage.awaitMessageComponent<
			ComponentType.Button | ComponentType.ChannelSelect
		>({
			filter: (index) => index.user.id === interaction.user.id,
		});

		if (componentInteraction.customId === components.buttons.back.customId) {
			await componentInteraction.deferUpdate();

			void toDashboard(interaction, id);

			return;
		}

		if (
			componentInteraction.customId === components.selectMenus.channel.customId ||
			componentInteraction.customId === components.buttons.lastChannel.customId
		) {
			await componentInteraction.deferUpdate();

			const channelId = componentInteraction.isChannelSelectMenu()
				? componentInteraction.values[0]
				: giveaway.channelId;

			if (!channelId) {
				interaction
					.editReply({
						components: [],
						content: `${Emojis.Error} Something went wrong. Try again.`,
						embeds: [],
					})
					.catch(() => null);

				return;
			}

			const channel = interaction.guild.channels.cache.get(channelId) as NewsChannel | TextChannel | undefined;

			if (!channel) {
				void retry(`${Emojis.Error} This channel does not exist.`);

				return;
			}

			const missingPermissions = getMissingPermissions(channel, "SendMessages", "EmbedLinks");

			if (missingPermissions.length > 0) {
				void retry(
					oneLine`
						${Emojis.Error} I am missing permissions in
						${channel}. Permissions needed: ${missingPermissions.join(", ")}
					`
				);

				return;
			}

			const message = await channel.send({
				allowedMentions: { parse: ["everyone", "roles"] },
				components: components.createRows(components.buttons.enterGiveaway.component(id)),
				content: giveaway.pingRolesMentions?.join(" "),
				embeds: [giveaway.toEmbed()],
			});

			await giveaway.announcementMessage?.delete();

			const urlButtonRows = components.createRows(
				components.buttons.url({
					label: "Go to announcement",
					url: message.url,
				})
			);

			interaction
				.followUp({
					components: urlButtonRows,
					content: `${Emojis.Sparks} Done! Reannounced the giveaway in ${channel.toString()}.`,
					embeds: [],
					ephemeral: true,
				})
				.catch(() => null);

			logger.log(`Reannounced giveaway #${giveaway.id} in ${channel.name} (${channelId})`);

			void giveaway.edit({
				announcementMessageId: message.id,
				channelId,
				nowOutdated: {
					announcementMessage: false,
				},
			});
		}

		if (
			componentInteraction.customId === components.buttons.editCurrentMessage.customId ||
			componentInteraction.customId === components.buttons.recallCurrentMessage.customId
		) {
			await componentInteraction.deferUpdate();

			if (!giveaway.channelId || !giveaway.announcementMessageId) {
				componentInteraction
					.followUp({
						content: `${Emojis.Warn} The giveaway is not announced.`,
						ephemeral: true,
					})
					.catch(() => null);

				return;
			}

			const channel = interaction.guild.channels.cache.get(giveaway.channelId);

			if (!channel) {
				void retry(
					stripIndents`
						${Emojis.Warn} I cannot find channel: ${giveaway.channelId} (${giveaway.channelId}).
						It may have been deleted.
					`
				);

				return;
			}

			if (!channel.isTextBased()) {
				await componentInteraction.deferUpdate();

				void retry(
					`${Emojis.Warn} The channel is not a text channel: ${giveaway.channelId} (${giveaway.channelId}).`
				);

				return;
			}

			const isEdit = componentInteraction.customId === components.buttons.editCurrentMessage.customId;

			const content = giveaway.pingRolesMentions?.join(" ");

			const embeds = [giveaway.toEmbed()];

			const urlOrNull = isEdit
				? await channel.messages
						.edit(giveaway.announcementMessageId, {
							allowedMentions: {
								roles: [...giveaway.pingRolesIds],
							},
							components: components.createRows(components.buttons.enterGiveaway.component(id)),
							content,
							embeds,
						})
						.then((message_) => message_.url)
						.catch(() => false)
				: await channel.messages
						.delete(giveaway.announcementMessageId)
						.then(() => true)
						.catch(() => false);

			if (isEdit) {
				const urlButtonRows = components.createRows(
					typeof urlOrNull === "string"
						? components.buttons.url({
								label: "Go to announcement",
								url: urlOrNull,
						  })
						: null
				);

				interaction
					.followUp({
						components: urlButtonRows,
						content:
							typeof urlOrNull === "string"
								? `${Emojis.Sparks} Done! The announcement has been updated in ${channel.toString()}.`
								: `${Emojis.Warn} I could not update the announcement. The message may have been deleted.`,
						embeds: [],
						ephemeral: true,
					})
					.catch(() => null);

				if (urlOrNull) {
					logger.log(
						`Edited the announcement of giveaway #${giveaway.id} in ${channel.name} (${channel.id})`
					);
				}
			} else {
				interaction
					.followUp({
						components: [],
						content: urlOrNull
							? `${
									Emojis.Sparks
							  } Done! The announcement has been recalled from ${channel.toString()}. All data remain intact.`
							: `${Emojis.Warn} I could not recall the announcement. The message may have been deleted.`,
						embeds: [],
						ephemeral: true,
					})
					.catch(() => null);

				if (urlOrNull) {
					logger.log(
						`Recalled announcement of giveaway #${giveaway.id} from ${channel.name} (${channel.id})`
					);
				}
			}

			if (urlOrNull) {
				await giveaway.edit({
					announcementMessageId: isEdit ? giveaway.announcementMessageId : null,
					nowOutdated: {
						announcementMessage: false,
					},
				});

				void toDashboard(componentInteraction, id);
			}
		}
	};

	void retry();
}
