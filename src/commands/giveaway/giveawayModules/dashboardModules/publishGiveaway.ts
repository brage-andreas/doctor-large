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
	type GuildTextBasedChannel,
	type NewsChannel,
	type TextChannel
} from "discord.js";
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
				components.selects.channelSelect.customId ||
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

			const permsInChannel =
				interaction.guild.members.me?.permissionsIn(channel);

			if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
				retry(
					`${Emojis.Warn} I am missing permissions to send messages in ${channel} (${channel.id})`
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
				publishedMessageId: msg.id,
				channelId: channel.id,
				nowOutdated: {
					publishedMessage: false
				}
			});

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Published giveaway #${id} in ${channel.name} (${channel.id})`
			);

			await interaction.followUp({
				components: [],
				ephemeral: true,
				content: stripIndents`
					${Emojis.Sparks} Done! Giveaway published in ${channel}.

					Here is a ${hyperlink(
						"link to your shiny new giveaway",
						hideLinkEmbed(msg.url)
					)}.
				`,
				embeds: []
			});

			toDashboard(interaction, id);
		}
	};

	retry();
}
