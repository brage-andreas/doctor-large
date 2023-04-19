import components from "#components";
import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import getMissingPermissions from "#helpers/getMissingPermissions.js";
import Logger from "#logger";
import { oneLine, stripIndents } from "common-tags";
import {
	type ButtonInteraction,
	type GuildTextBasedChannel,
	type NewsChannel,
	type TextChannel
} from "discord.js";
import toDashboard from "../dashboard.js";

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
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction
			.followUp({
				ephemeral: true,
				content: stripIndents`
					${Emojis.Error} This giveaway has no prizes. Add some prizes, and try again.
					
					If the prize(s) are a secret, you can for example name the prize "Secret"
				`
			})
			.catch(() => null);

		toDashboard(interaction, id);

		return;
	}

	const chooseChannelStr = stripIndents`
		Select the channel you would like to announce the giveaway in.

		${
			giveaway.channelId
				? `Previous channel: <#${giveaway.channelId}> (${giveaway.channelId})`
				: ""
		}
	`;

	const rows = components.createRows(
		components.selectMenus.channel,
		components.buttons.back,
		giveaway.channelId ? components.buttons.lastChannel : null
	);

	const retry = async (message?: string) => {
		if (message) {
			interaction.followUp({ content: message, ephemeral: true });
		}

		const updateMsg = await interaction.editReply({
			content: chooseChannelStr,
			components: rows,
			embeds: [giveaway.toEmbed()]
		});

		const componentInteraction = await updateMsg.awaitMessageComponent({
			filter: (i) => i.user.id === interaction.user.id
		});

		await componentInteraction.deferUpdate();

		if (
			componentInteraction.customId === components.buttons.back.customId
		) {
			toDashboard(interaction, id);

			return;
		}

		if (
			componentInteraction.customId ===
				components.selectMenus.channel.customId ||
			componentInteraction.customId ===
				components.buttons.lastChannel.customId
		) {
			let channel: GuildTextBasedChannel;

			if (componentInteraction.isChannelSelectMenu()) {
				const channelId = componentInteraction.values[0];
				const channel_ = interaction.guild.channels.cache.get(
					channelId
				) as NewsChannel | TextChannel | undefined;

				if (!channel_) {
					retry(`${Emojis.Warn} This channel does not exist.`);

					return;
				}

				channel = channel_;
			} else {
				const channel_ = giveaway.channel;

				if (!channel_) {
					retry(`${Emojis.Warn} This channel does not exist.`);

					return;
				}

				channel = channel_;
			}

			const missingPerms = getMissingPermissions(
				channel,
				"SendMessages",
				"EmbedLinks"
			);

			if (missingPerms.length) {
				retry(
					oneLine`
						${Emojis.Error} I am missing permissions
						in ${channel}. Permissions needed: ${missingPerms.join(", ")}
					`
				);

				return;
			}

			const msg = await channel.send({
				allowedMentions: {
					parse: ["roles", "everyone"]
				},
				components: components.createRows(
					components.buttons.enterGiveaway.component(id)
				),
				content: giveaway.pingRolesMentions?.join(" "),
				embeds: [giveaway.toEmbed()]
			});

			await giveaway.edit({
				announcementMessageId: msg.id,
				channelId: channel.id,
				nowOutdated: {
					announcementMessage: false
				}
			});

			new Logger({ label: "GIVEAWAY", interaction }).log(
				`Announced giveaway #${id} in ${channel.name} (${channel.id})`
			);

			const urlButtonRows = components.createRows(
				components.buttons.url({
					label: "Go to announcement",
					url: msg.url
				})
			);

			await interaction.followUp({
				components: urlButtonRows,
				ephemeral: true,
				content: `${Emojis.Sparks} Done! Giveaway announced in ${channel}.`,
				embeds: []
			});

			toDashboard(interaction, id);
		}
	};

	retry();
}
