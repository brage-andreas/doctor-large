import components from "#components";
import { Emojis } from "#constants";
import ConfigManager from "#database/config.js";
import { listify } from "#helpers/listify.js";
import { messageToEmbed } from "#helpers/messageHelpers.js";
import yesNo from "#helpers/yesNo.js";
import Logger from "#logger";
import { type CommandData, type CommandExport } from "#typings";
import { oneLine, stripIndent, stripIndents } from "common-tags";
import {
	ChannelType,
	hideLinkEmbed,
	hyperlink,
	PermissionFlagsBits,
	underscore,
	type ChatInputCommandInteraction,
	type GuildTextBasedChannel,
	type TextChannel
} from "discord.js";

const data: CommandData = {
	chatInput: {
		name: "archive-oldest-pin",
		description: "Archive the oldest pin from this channel.",
		dm_permission: false,
		default_member_permissions:
			PermissionFlagsBits.ManageMessages.toString()
	}
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	await interaction.deferReply({ ephemeral: true });

	if (!interaction.channel) {
		await interaction.editReply({
			content: `${Emojis.Error} Something went wrong. Try again.`
		});

		return;
	}

	if (
		!interaction.guild.members.me
			?.permissionsIn(interaction.channel.id)
			.has(PermissionFlagsBits.ManageMessages)
	) {
		await interaction.editReply({
			content: oneLine`
				${Emojis.Error} I am missing permissions to unpin messages in
				this channel. Permissions needed: \`Manage Messages\`.
			`
		});

		return;
	}

	const allMessages = await interaction.channel.messages
		.fetchPinned(false)
		.catch(() => null);

	if (!allMessages?.size) {
		interaction.editReply({
			content: `${Emojis.SweatSmile} There are no pins to archive.`
		});

		return;
	}

	const message = [...allMessages.values()].sort(
		(a, b) => a.createdTimestamp - b.createdTimestamp
	)[0];

	const manager = new ConfigManager(interaction.guild);
	const config = await manager
		.validate()
		.then(async () => manager.get())
		.catch(() => null);

	if (config?.isProtectedChannel(interaction.channelId)) {
		await interaction.editReply({
			content: `${Emojis.Error} You cannot archive this pin, as it originates from a protected channel.`
		});

		return;
	}

	const embed = messageToEmbed(message);

	const res = await yesNo({
		data: {
			content:
				"Here is a preview of what will be archived. Do you want to continue?",
			embeds: [embed]
		},
		medium: interaction,
		filter: (i) => i.user.id === interaction.user.id
	});

	if (!res) {
		interaction.editReply({
			components: [],
			content: `${Emojis.Sparks} Alright! Cancelled archiving pins.`,
			embeds: []
		});

		return;
	}

	let uncertainChannel: GuildTextBasedChannel | undefined;

	if (config?.pinArchiveChannel) {
		const res = await yesNo({
			medium: interaction,
			data: {
				content: stripIndents`
					Do you want to archive the pin in ${config.pinArchiveChannel}?

					This channel is defined as your pin archive channel in the config.
				`
			}
		});

		if (res) {
			uncertainChannel = config.pinArchiveChannel;
		}
	}

	if (!uncertainChannel) {
		const rows = components.createRows(
			components.selects.channelSelect.component({
				channelTypes: [
					ChannelType.GuildText,
					ChannelType.GuildAnnouncement,
					ChannelType.PrivateThread,
					ChannelType.PublicThread
				]
			}),
			components.buttons.back.component()
		);

		const msg = await interaction.editReply({
			components: rows,
			content: "Select the channel to archive in.",
			embeds: []
		});

		const component = await msg
			.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id,
				time: 60_000
			})
			.catch(() => null);

		if (!component) {
			await interaction.editReply({
				components: [],
				content: `${Emojis.Sparks} Alright! Cancelled archiving pins.`,
				embeds: []
			});

			return;
		}

		if (!component.isChannelSelectMenu()) {
			await component.update({
				components: [],
				content: `${Emojis.Sparks} Alright! Cancelled archiving pins.`,
				embeds: []
			});

			return;
		}

		await component.deferUpdate();

		const channelId = component.values[0];
		const selectedChannel = component.guild.channels.cache.get(
			channelId
		) as TextChannel | undefined;

		if (!selectedChannel) {
			await component.editReply({
				components: [],
				content: `${Emojis.Error} I could not find channel \`${channelId}\`. Please try again later.`,
				embeds: []
			});

			return;
		}

		uncertainChannel = selectedChannel;
	}

	// type inferring is being weird
	const channel = uncertainChannel;

	const hasPermissionInChannel = (permission: bigint) =>
		interaction.guild.members.me?.permissionsIn(channel).has(permission);

	const missingPermissions: Array<string> = [];

	if (!hasPermissionInChannel(PermissionFlagsBits.SendMessages)) {
		missingPermissions.push("`Send Messages`");
	}

	if (!hasPermissionInChannel(PermissionFlagsBits.EmbedLinks)) {
		missingPermissions.push("`Embed Links`");
	}

	if (
		channel.isThread() &&
		!hasPermissionInChannel(PermissionFlagsBits.SendMessagesInThreads)
	) {
		missingPermissions.push("`Send Messages In Threads`");
	}

	if (missingPermissions.length) {
		const list = listify(missingPermissions, { length: 3 });
		await interaction.editReply({
			components: [],
			content: oneLine`
				${Emojis.Error} I am missing permissions to in
				this channel. Permissions needed: ${list}.
			`,
			embeds: []
		});

		return;
	}

	const unpinned = await interaction.channel.messages
		.unpin(message)
		.then(() => true)
		.catch(() => false);

	if (unpinned) {
		new Logger({ interaction, prefix: "ARCHIVE PINS" }).log(
			`Archived pin ${message.id} by ${message.author.tag} (${message.author.id})`,
			`in archive channel #${channel.name} (${channel.id})`
		);

		const rows = components.createRows(
			components.buttons
				.url({ label: "Original message", url: message.url })
				.component()
		);

		const { url } = await channel.send({
			embeds: [embed],
			components: rows
		});

		await interaction.editReply({
			components: [],
			content: stripIndent`
				${Emojis.V} Done! Here is ${hyperlink("a link", hideLinkEmbed(url))}.
			`,
			embeds: []
		});
	} else {
		const link = hyperlink(
			"the original message",
			hideLinkEmbed(message.url)
		);

		await interaction.editReply({
			components: [],
			content: stripIndent`
				${Emojis.Error} Failed to unpin ${link}. Archive was cancelled.
				
				Causes of failure ${underscore("could")} be:
				  a) message was unpinned since the command was used
				  b) message was deleted since the command was used
				  c) I am missing \`Manage Messages\` permission
			`,
			embeds: []
		});
	}
};

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput
	}
});
