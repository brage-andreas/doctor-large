import components from "#components";
import { EMOJIS } from "#constants";
import messageToEmbed from "#helpers/messageToEmbed.js";
import { messageFromURL } from "#helpers/parseMessageURL.js";
import { type Command, type CommandData } from "#typings";
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
			content: `${EMOJIS.ERROR} Something went wrong. Please try again later.`
		});
	}

	const urlInput = interaction.options.getString("message_link", true);

	const message = await messageFromURL(interaction.client, urlInput);

	if (!message) {
		return await interaction.editReply({
			content: `${EMOJIS.ERROR} I could not find a message with the url: \`${urlInput}\``
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
