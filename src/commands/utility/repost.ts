import components from "#components";
import { Emojis } from "#constants";
import ConfigManager from "#database/config.js";
import { messageFromURL, messageToEmbed, parseMessageURL } from "#helpers";
import Logger from "#logger";
import { type CommandData, type CommandExport } from "#typings";
import { stripIndents } from "common-tags";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	PermissionFlagsBits,
	inlineCode,
	type ChatInputCommandInteraction,
	type Message,
	type MessageContextMenuCommandInteraction
} from "discord.js";

const data: CommandData = {
	chatInput: {
		name: "repost",
		description: "Repost a message to this channel.",
		default_member_permissions:
			PermissionFlagsBits.ManageMessages.toString(),
		dm_permission: false,
		options: [
			{
				name: "message_link",
				description: "The message to repost.",
				type: ApplicationCommandOptionType.String,
				required: true
			}
		]
	},
	contextMenu: {
		name: "Repost",
		dm_permission: false,
		default_member_permissions:
			PermissionFlagsBits.ManageMessages.toString(),
		type: ApplicationCommandType.Message
	}
};

const handle = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| MessageContextMenuCommandInteraction<"cached">,
	message: Message<true>
) => {
	const embeds = messageToEmbed(message);

	const urlButton = components.buttons
		.url({
			label: "Original message",
			url: message.url
		})
		.component();

	const row = components.createRows(urlButton);

	new Logger({ interaction, label: "REPOST" }).log(
		`Reposted message (${message.id}) by ${message.author.tag}`
	);

	await interaction.editReply({
		embeds: [embeds],
		components: row
	});
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	if (!interaction.channel) {
		await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} Something went wrong. Please try again later.`
		});

		return;
	}

	const urlInput = interaction.options.getString("message_link", true);

	const parsedURL = parseMessageURL(urlInput);

	if (!parsedURL) {
		await interaction.reply({
			ephemeral: true,
			content: stripIndents`
				${Emojis.Error} Could not parse the message URL. Double-check it and try again.
				${inlineCode(urlInput)}
			`
		});

		return;
	}

	if (parsedURL.guildId !== interaction.guildId) {
		await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} The message is not from this server.`
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(parsedURL.channelId);

	if (!channel?.isTextBased()) {
		await interaction.reply({
			ephemeral: true,
			content: `${
				Emojis.Error
			} The channel from the URL is invalid: ${inlineCode(urlInput)}`
		});

		return;
	}

	const isProtectedChannel =
		channel.id !== interaction.channelId &&
		(await ConfigManager.isProtectedChannel(interaction.guildId, {
			channel
		}));

	if (isProtectedChannel) {
		await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} You cannot repost this message, as it originates from a protected channel.`
		});

		return;
	}

	const message = await messageFromURL(interaction.client, parsedURL);

	if (!message) {
		await interaction.reply({
			ephemeral: true,
			content: `${
				Emojis.Error
			} I could not find a message with the URL: ${inlineCode(urlInput)}`
		});

		return;
	}

	await interaction.deferReply({ ephemeral: false });

	handle(interaction, message);
};

const contextMenu = async (
	interaction: MessageContextMenuCommandInteraction<"cached">
) => {
	await interaction.deferReply({ ephemeral: false });

	handle(interaction, interaction.targetMessage);
};

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu
	}
});
