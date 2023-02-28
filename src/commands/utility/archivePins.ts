import components from "#components";
import { Emojis } from "#constants";
import messageToEmbed from "#helpers/messageToEmbed.js";
import yesNo from "#helpers/yesNo.js";
import { type Command, type CommandData } from "#typings";
import { source } from "common-tags";
import {
	ActionRowBuilder,
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
	commandName: "archive_pins",
	contextMenu: {
		name: "Archive 5 oldest pins",
		dm_permission: false,
		default_member_permissions:
			PermissionFlagsBits.ManageMessages.toString(),
		type: ApplicationCommandType.Message
	}
};

const contextMenu = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| ContextMenuCommandInteraction<"cached">
) => {
	await interaction.deferReply({ ephemeral: true });

	const allMessages = await interaction.channel?.messages
		.fetchPinned()
		.catch(() => null);

	if (!allMessages?.size) {
		return interaction.editReply({
			content: `${Emojis.SweatSmile} There are no pins to archive.`
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
			${Emojis.Warn} Missing permissions to delete messages:
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
			content: `${Emojis.Sparks} Alright! Cancelled archiving pins.`,
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
			content: `${Emojis.Sparks} Alright! Cancelled archiving pins.`,
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
		contextMenu
	}
});
