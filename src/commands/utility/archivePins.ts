import components from "#components";
import { Emojis } from "#constants";
import { messageToEmbed } from "#helpers/messageHelpers.js";
import yesNo from "#helpers/yesNo.js";
import Logger from "#logger";
import { type CommandData, type CommandExport } from "#typings";
import { oneLine, source, stripIndent } from "common-tags";
import {
	ApplicationCommandType,
	PermissionFlagsBits,
	type ChatInputCommandInteraction,
	type MessageContextMenuCommandInteraction,
	type TextChannel
} from "discord.js";

const data: CommandData = {
	commandName: "archive_oldest_pin",
	chatInput: {
		name: "archive_oldest_pin",
		description: "Archive the oldest pin from this channel.",
		dm_permission: false,
		default_member_permissions:
			PermissionFlagsBits.ManageMessages.toString()
	},
	contextMenu: {
		name: "Archive oldest pin",
		dm_permission: false,
		default_member_permissions:
			PermissionFlagsBits.ManageMessages.toString(),
		type: ApplicationCommandType.Message
	}
};

const handle = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| MessageContextMenuCommandInteraction<"cached">
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
				this channel. Permissions needed: \`Manage Message\`.
			`
		});

		return;
	}

	const allMessages = await interaction.channel?.messages
		.fetchPinned(false)
		.catch(() => null);

	if (!allMessages?.size) {
		return interaction.editReply({
			content: `${Emojis.SweatSmile} There are no pins to archive.`
		});
	}

	const message = [...allMessages.values()].sort(
		(a, b) => a.createdTimestamp - b.createdTimestamp
	)[0];

	const link = !message.deletable
		? `[this message](<${message.url}>) by ${message.author.tag}`
		: null;

	const missingPerms = link
		? source`
			${Emojis.Error} Missing permissions to delete ${link}
		`
		: "";

	const embed = messageToEmbed(message);

	const res = await yesNo({
		data: {
			content: [
				"Here is a preview of what will be archived. Do you want to continue?",
				missingPerms
			]
				.join("\n\n")
				.trim(),
			embeds: [embed]
		},
		medium: interaction,
		filter: (i) => i.user.id === interaction.user.id
	});

	if (!res) {
		return interaction.editReply({
			components: [],
			content: `${Emojis.Sparks} Alright! Cancelled archiving pins.`,
			embeds: []
		});
	}

	const rows = components.createRows(
		components.selects.channelSelect.component(),
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
	const channel = component.guild.channels.cache.get(channelId) as
		| TextChannel
		| undefined;

	if (!channel) {
		await component.editReply({
			components: [],
			content: `${Emojis.Error} I could not find channel \`${channelId}\`. Please try again later.`,
			embeds: []
		});

		return;
	}

	if (
		!component.guild.members.me
			?.permissionsIn(channel)
			.has(PermissionFlagsBits.SendMessages)
	) {
		await component.editReply({
			components: [],
			content: oneLine`
				${Emojis.Error} I am missing permissions to send messages in
				this channel. Permissions needed: \`Send Messages\`.
			`,
			embeds: []
		});

		return;
	}

	const unpinned = await component.channel?.messages
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

		await component.editReply({
			components: [],
			content: stripIndent`
				${Emojis.V} Done! Here is [a link](<${url}>).
			`,
			embeds: []
		});
	} else {
		await component.editReply({
			components: [],
			content: stripIndent`
				${Emojis.Error} Failed to unpin ${link}. Archive was cancelled.
				Check my permissions and try again later.
			`,
			embeds: []
		});
	}
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	await handle(interaction);
};

const contextMenu = async (
	interaction: MessageContextMenuCommandInteraction<"cached">
) => {
	await handle(interaction);
};

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu
	}
});
