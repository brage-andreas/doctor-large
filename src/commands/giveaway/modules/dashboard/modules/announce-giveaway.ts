import { type ButtonInteraction, type GuildTextBasedChannel, type NewsChannel, type TextChannel } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import { oneLine, stripIndents } from "common-tags";
import { listMissingPermissions } from "#helpers";
import components from "#discord-components";
import toDashboard from "../dashboard.js";
import { Emojis } from "#constants";
import Logger from "#logger";

export default async function toAnnounceGiveaway(
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

	if (!giveaway.prizesQuantity()) {
		await interaction
			.followUp({
				content: stripIndents`
					${Emojis.Error} This giveaway has no prizes. Add some prizes, and try again.
					
					If the prize(s) are a secret, you can for example name the prize "Secret"
				`,
				ephemeral: true,
			})
			.catch(() => null);

		void toDashboard(interaction, id);

		return;
	}

	const chooseChannelString = stripIndents`
		Select the channel you would like to announce the giveaway in.

		${giveaway.channelId ? `Previous channel: <#${giveaway.channelId}> (${giveaway.channelId})` : ""}
	`;

	const rows = components.createRows(
		components.selectMenus.channel,
		components.buttons.back,
		giveaway.channelId ? components.buttons.lastChannel : null
	);

	const retry = async (message?: string) => {
		if (message) {
			interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
		}

		const updateMessage = await interaction.editReply({
			components: rows,
			content: chooseChannelString,
			embeds: [giveaway.toEmbed()],
		});

		const componentInteraction = await updateMessage.awaitMessageComponent({
			filter: (index) => index.user.id === interaction.user.id,
		});

		await componentInteraction.deferUpdate();

		if (componentInteraction.customId === components.buttons.back.customId) {
			void toDashboard(interaction, id);

			return;
		}

		if (
			componentInteraction.customId === components.selectMenus.channel.customId ||
			componentInteraction.customId === components.buttons.lastChannel.customId
		) {
			let channel: GuildTextBasedChannel;

			if (componentInteraction.isChannelSelectMenu()) {
				const channelId = componentInteraction.values[0];
				const channel_ = interaction.guild.channels.cache.get(channelId) as
					| NewsChannel
					| TextChannel
					| undefined;

				if (!channel_) {
					void retry(`${Emojis.Warn} This channel does not exist.`);

					return;
				}

				channel = channel_;
			} else {
				const channel_ = giveaway.channel;

				if (!channel_) {
					void retry(`${Emojis.Warn} This channel does not exist.`);

					return;
				}

				channel = channel_;
			}

			const missingPerms = listMissingPermissions(channel, "SendMessages", "EmbedLinks");

			if (missingPerms.length > 0) {
				void retry(
					oneLine`
						${Emojis.Error} I am missing permissions
						in ${channel}. Permissions needed: ${missingPerms.join(", ")}
					`
				);

				return;
			}

			const message_ = await channel.send({
				allowedMentions: {
					parse: ["roles", "everyone"],
				},
				components: components.createRows(components.buttons.enterGiveaway.component(id)),
				content: giveaway.pingRolesMentions?.join(" "),
				embeds: [giveaway.toEmbed()],
			});

			await giveaway.edit({
				announcementMessageId: message_.id,
				channelId: channel.id,
				nowOutdated: {
					announcementMessage: false,
				},
			});

			new Logger({ interaction, label: "GIVEAWAY" }).log(
				`Announced giveaway #${id} in ${channel.name} (${channel.id})`
			);

			const urlButtonRows = components.createRows(
				components.buttons.url({
					label: "Go to announcement",
					url: message_.url,
				})
			);

			await interaction.followUp({
				components: urlButtonRows,
				content: `${Emojis.Sparks} Done! Giveaway announced in ${channel.toString()}.`,
				embeds: [],
				ephemeral: true,
			});

			void toDashboard(interaction, id);
		}
	};

	void retry();
}
