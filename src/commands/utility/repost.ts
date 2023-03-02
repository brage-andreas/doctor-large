import components from "#components";
import { Emojis } from "#constants";
import {
	messageFromURL,
	messageToEmbed,
	parseMessageURL
} from "#helpers/messageHelpers.js";
import Logger from "#logger";
import { type Command, type CommandData } from "#typings";
import { oneLine } from "common-tags";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	PermissionFlagsBits,
	type ChatInputCommandInteraction,
	type Message,
	type MessageContextMenuCommandInteraction
} from "discord.js";

const data: CommandData = {
	commandName: "repost",
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
	await interaction.deferReply({ ephemeral: false });

	if (!interaction.channel) {
		return await interaction.editReply({
			content: `${Emojis.Error} Something went wrong. Please try again later.`
		});
	}

	const urlInput = interaction.options.getString("message_link", true);

	const data = parseMessageURL(urlInput);

	if (!data) {
		await interaction.editReply({
			content: oneLine`
				${Emojis.Error} Could not parse \`${urlInput}\` as a message URL.
				Double-check it and try again.
			`
		});

		return;
	}

	if (data.guildId !== interaction.guildId) {
		await interaction.editReply({
			content: `${Emojis.Error} The message is not from this server.`
		});

		return;
	}

	// TODO: protected channel check

	const message = await messageFromURL(interaction.client, data);

	if (!message) {
		return await interaction.editReply({
			content: `${Emojis.Error} I could not find a message with the url: \`${urlInput}\``
		});
	}

	handle(interaction, message);
};

const contextMenu = async (
	interaction: MessageContextMenuCommandInteraction<"cached">
) => {
	await interaction.deferReply({ ephemeral: false });

	handle(interaction, interaction.targetMessage);
};

export const getCommand: () => Command = () => ({
	data,
	handle: {
		chatInput,
		contextMenu
	}
});
