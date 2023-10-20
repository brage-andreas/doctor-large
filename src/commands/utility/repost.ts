import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type ChatInputCommandInteraction,
	type Message,
	type MessageContextMenuCommandInteraction,
	PermissionFlagsBits,
	inlineCode,
} from "discord.js";
import { destructureMessageURL, getMessageFromURL, messageToEmbed } from "#helpers";
import { type CommandData, type CommandExport } from "#typings";
import ConfigManager from "#database/config.js";
import components from "#discord-components";
import { stripIndents } from "common-tags";
import { Emojis } from "#constants";
import Logger from "#logger";

const data: CommandData = {
	chatInput: {
		default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
		description: "Repost a message to this channel.",
		dm_permission: false,
		name: "repost",
		options: [
			{
				description: "The message to repost.",
				name: "message_link",
				required: true,
				type: ApplicationCommandOptionType.String,
			},
		],
	},
	contextMenu: {
		default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
		dm_permission: false,
		name: "Repost",
		type: ApplicationCommandType.Message,
	},
};

const handle = async (
	interaction: ChatInputCommandInteraction<"cached"> | MessageContextMenuCommandInteraction<"cached">,
	message: Message<true>
) => {
	const embeds = messageToEmbed(message);

	const urlButton = components.buttons
		.url({
			label: "Original message",
			url: message.url,
		})
		.component();

	const row = components.createRows(urlButton);

	new Logger({ interaction, label: "REPOST" }).log(`Reposted message (${message.id}) by ${message.author.tag}`);

	await interaction.editReply({
		components: row,
		embeds: [embeds],
	});
};

const chatInput = async (interaction: ChatInputCommandInteraction<"cached">) => {
	if (!interaction.channel) {
		await interaction.reply({
			content: `${Emojis.Error} Something went wrong. Please try again later.`,
			ephemeral: true,
		});

		return;
	}

	const urlInput = interaction.options.getString("message_link", true);

	const parsedURL = destructureMessageURL(urlInput);

	if (!parsedURL) {
		await interaction.reply({
			content: stripIndents`
				${Emojis.Error} Could not parse the message URL. Double-check it and try again.
				${inlineCode(urlInput)}
			`,
			ephemeral: true,
		});

		return;
	}

	if (parsedURL.guildId !== interaction.guildId) {
		await interaction.reply({
			content: `${Emojis.Error} The message is not from this server.`,
			ephemeral: true,
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(parsedURL.channelId);

	if (!channel?.isTextBased()) {
		await interaction.reply({
			content: `${Emojis.Error} The channel from the URL is invalid: ${inlineCode(urlInput)}`,
			ephemeral: true,
		});

		return;
	}

	const isProtectedChannel =
		channel.id !== interaction.channelId &&
		(await ConfigManager.isProtectedChannel(interaction.guildId, {
			channel,
		}));

	if (isProtectedChannel) {
		await interaction.reply({
			content: `${Emojis.Error} You cannot repost this message, as it originates from a protected channel.`,
			ephemeral: true,
		});

		return;
	}

	const message = await getMessageFromURL(interaction.client, parsedURL);

	if (!message) {
		await interaction.reply({
			content: `${Emojis.Error} I could not find a message with the URL: ${inlineCode(urlInput)}`,
			ephemeral: true,
		});

		return;
	}

	await interaction.deferReply({ ephemeral: false });

	void handle(interaction, message);
};

const contextMenu = async (interaction: MessageContextMenuCommandInteraction<"cached">) => {
	await interaction.deferReply({ ephemeral: false });

	void handle(interaction, interaction.targetMessage);
};

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu,
	},
});
