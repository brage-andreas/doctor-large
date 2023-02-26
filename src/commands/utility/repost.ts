import components from "#components";
import { EMOJIS } from "#constants";
import messageToEmbed from "#helpers/messageToEmbed.js";
import yesNo from "#helpers/yesNo.js";
import { type Command, type CommandData } from "#typings";
import { source } from "common-tags";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ApplicationCommandType,
	PermissionFlagsBits,
	type ButtonBuilder,
	type ChannelSelectMenuBuilder,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type NewsChannel,
	type TextChannel
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

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	await interaction.reply({
		ephemeral: true,
		content: `${EMOJIS.WIP} This command is work-in-progress and will be available at a later date.`
	});
	// await interaction.deferReply({ ephemeral: true });
};

const contextMenu = async (
	interaction: ContextMenuCommandInteraction<"cached">
) => {
	await interaction.deferReply({ ephemeral: true });

	const allMessages = await interaction.channel?.messages
		.fetchPinned()
		.catch(() => null);

	if (!allMessages?.size) {
		return interaction.editReply({
			content: `${EMOJIS.SWEAT_SMILE} There are no pins to archive.`
		});
	}

	const messages = [...allMessages.values()]
		.sort((a, b) => a.createdTimestamp - b.createdTimestamp)
		.slice(0, 5);

	const links = messages
		.filter((m) => !m.deletable)
		.map((m) => `→ [Message](<${m.url}>) by ${m.author.tag}`);

	const missingPerms = links.length
		? source`
			${EMOJIS.WARN} Missing permissions to delete messages:
			  ${links.join("\n")}
		`
		: "";

	const embeds = messages.map((message) => messageToEmbed(message));

	const res = await yesNo({
		data: {
			content: [
				"Here is a preview of what will be archived. Do you want to continue?",
				missingPerms
			]
				.join("\n\n")
				.trim(),
			embeds
		},
		medium: interaction,
		filter: (i) => i.user.id === interaction.user.id
	});

	if (!res) {
		return interaction.editReply({
			components: [],
			content: `${EMOJIS.SPARKS} Alright! Cancelled archiving pins.`,
			embeds: []
		});
	}

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		components.selects.channelSelect.component()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		components.buttons.back.component()
	);

	const msg = await interaction.editReply({
		components: [row1, row2],
		content: "Select the channel to archive in.",
		embeds: []
	});

	const component = await msg
		.awaitMessageComponent({
			filter: (i) => i.user.id === interaction.user.id,
			time: 60_000
		})
		.catch(() => null);

	if (!component?.isChannelSelectMenu()) {
		return interaction.editReply({
			components: [],
			content: `${EMOJIS.SPARKS} Alright! Cancelled archiving pins.`,
			embeds: []
		});
	}

	const channelId = component.values[0];
	const channel = interaction.guild.channels.cache.get(channelId) as
		| NewsChannel
		| TextChannel
		| undefined;

	await interaction.channel?.bulkDelete(messages);

	for (const embed of embeds) {
		await channel?.send({ embeds: [embed] });
	}
};

export const getCommand: () => Command = () => ({
	data,
	handle: {
		chatInput,
		contextMenu
	}
});
