import components from "#components";
import { Emojis } from "#constants";
import ConfigManager from "#database/config.js";
import {
	messageFromURL,
	messageToEmbed,
	parseMessageURL
} from "#helpers/messageHelpers.js";
import Logger from "#logger";
import { type CommandData, type CommandExport } from "#typings";
import { stripIndents } from "common-tags";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	PermissionFlagsBits,
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
		name: "Repost message",
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

	new Logger({ interaction, prefix: "REPOST" }).log(
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
		return await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} Something went wrong. Please try again later.`
		});
	}

	const urlInput = interaction.options.getString("message_link", true);

	const data = parseMessageURL(urlInput);

	if (!data) {
		await interaction.reply({
			ephemeral: true,
			content: stripIndents`
				${Emojis.Error} Could not parse message URL. Double-check it and try again.
				\`${urlInput}\`
			`
		});

		return;
	}

	if (data.guildId !== interaction.guildId) {
		await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} The message is not from this server.`
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(data.channelId);

	if (!channel?.isTextBased()) {
		await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} The channel from the URL is invalid: \`${urlInput}\``
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

	const message = await messageFromURL(interaction.client, data);

	if (!message) {
		return await interaction.reply({
			ephemeral: true,
			content: `${Emojis.Error} I could not find a message with the URL: \`${urlInput}\``
		});
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

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu
	}
});
