import components from "#components";
import { Emojis } from "#constants";
import ConfigManager from "#database/config.js";
import { messageFromURL, parseMessageURL } from "#helpers/messageHelpers.js";
import { ModalCollector } from "#helpers/ModalCollector.js";
import yesNo from "#helpers/yesNo.js";
import type ConfigModule from "#modules/Config.js";
import { type CommandData, type CommandExport } from "#typings";
import { stripIndents } from "common-tags";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	time,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type GuildMember,
	type Message,
	type MessageContextMenuCommandInteraction,
	type UserContextMenuCommandInteraction
} from "discord.js";

const data: CommandData = {
	chatInput: {
		name: "report",
		dm_permission: false,
		description: "Report a member or a user to the moderators.",
		options: [
			{
				name: "message",
				description: "Report a message to the moderators.",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "message-url",
						description: "The URL to the message.",
						type: ApplicationCommandOptionType.String,
						required: true
					},
					{
						name: "comment",
						description: "A comment to help the moderators.",
						type: ApplicationCommandOptionType.String,
						required: true
					},
					{
						name: "anonymous",
						description: "Hide your identity to the moderators.",
						type: ApplicationCommandOptionType.Boolean
					}
				]
			},
			{
				name: "user",
				description: "Report a user to the moderators",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "user",
						description: "The user to target.",
						type: ApplicationCommandOptionType.User,
						required: true
					},
					{
						name: "comment",
						description: "A comment to help the moderators.",
						type: ApplicationCommandOptionType.String,
						required: true
					},
					{
						name: "anonymous",
						description:
							"Hide your identity to the moderators. (False)",
						type: ApplicationCommandOptionType.Boolean
					}
				]
			}
		]
	},
	messageContextMenu: {
		name: "Report message",
		type: ApplicationCommandType.Message
	},
	userContextMenu: {
		name: "Report user",
		type: ApplicationCommandType.User
	}
};

const handleMessage = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| MessageContextMenuCommandInteraction<"cached">,
	config: ConfigModule,
	message: Message<true>,
	comment: string,
	anonymous?: boolean
) => {
	const res = await yesNo({
		medium: interaction,
		data: {
			content: "lol"
		}
	});

	if (res) {
		//
	}

	config;
	message;
	comment;
	anonymous;
};

const handleMember = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| UserContextMenuCommandInteraction<"cached">,
	config: ConfigModule,
	member: GuildMember,
	comment: string,
	anonymous?: boolean
) => {
	await interaction.editReply({});
	config;
	member;
	comment;
	anonymous;
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	await interaction.deferReply({ ephemeral: true });

	const configManager = new ConfigManager(interaction.guild);

	const validation = await configManager
		.validate()
		.then(() => true)
		.catch(() => false);

	if (!validation) {
		interaction.editReply({
			content: `${Emojis.NoEntry} Reporting is disabled in this server, as it has not been set up.`
		});

		return;
	}

	const config = await configManager.get();

	if (!config.reportEnabled) {
		interaction.editReply({
			content: `${Emojis.NoEntry} Reporting is disabled in this server.`
		});

		return;
	}

	const anonymous = interaction.options.getBoolean("anonymous") ?? false;
	const comment = interaction.options.getString("comment", true);
	const subcommand = interaction.options.getSubcommand();

	if (subcommand === "message") {
		const messageURL = interaction.options.getString("message-url", true);

		const parsedURL = parseMessageURL(messageURL);

		if (!parsedURL) {
			await interaction.editReply({
				content: stripIndents`
					${Emojis.Error} Could not parse the message URL. Double-check it and try again.
					\`${messageURL}\`
				`
			});

			return;
		}

		if (parsedURL.guildId !== interaction.guildId) {
			await interaction.editReply({
				content: `${Emojis.Error} The message is not from this server.`
			});

			return;
		}

		const channel = interaction.guild.channels.cache.get(
			parsedURL.channelId
		);

		if (!channel?.isTextBased()) {
			await interaction.editReply({
				content: `${Emojis.Error} The channel from the URL is invalid: \`${messageURL}\``
			});

			return;
		}

		const message = await messageFromURL(interaction.client, parsedURL);

		if (!message) {
			await interaction.reply({
				ephemeral: true,
				content: `${Emojis.Error} I could not find a message with the URL: \`${messageURL}\``
			});

			return;
		}

		handleMessage(interaction, config, message, comment, anonymous);
	}
};

const contextMenu = async (
	interaction: ContextMenuCommandInteraction<"cached">
) => {
	const configManager = new ConfigManager(interaction.guild);

	const validation = await configManager
		.validate()
		.then(() => true)
		.catch(() => false);

	if (!validation) {
		interaction.editReply({
			content: `${Emojis.NoEntry} Reporting is disabled in this server, as it has not been set up.`
		});

		return;
	}

	const config = await configManager.get();

	if (!config.reportEnabled) {
		interaction.editReply({
			content: `${Emojis.NoEntry} Reporting is disabled in this server.`
		});

		return;
	}

	const modal = components.modals.createReport.component();

	await interaction.showModal(modal);

	const cancel = components.createRows(components.buttons.cancel.component());

	const msg = await interaction.editReply({
		components: cancel,
		content: `Creating a report... (time limit ${time(
			Date.now() + 300_000,
			"R"
		)})`
	});

	const modalCollector = ModalCollector(interaction, modal, {
		time: 180_000
	});

	const cancelCollector = msg.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		max: 1,
		time: 190_000
	});

	cancelCollector.on("collect", async (i) => {
		modalCollector.stop("manual");

		await i.update({
			components: [],
			content: "Canceled the report."
		});
	});

	modalCollector.on("collect", (modalInteraction) => {
		const comment = modalInteraction.fields.getTextInputValue("comment");

		if (interaction.isMessageContextMenuCommand()) {
			handleMessage(
				interaction,
				config,
				interaction.targetMessage,
				comment
			);
		}

		if (interaction.isUserContextMenuCommand()) {
			handleMember(
				interaction,
				config,
				interaction.targetMember,
				comment
			);
		}
	});

	modalCollector.on("end", (_, reason) => {
		if (reason === "time") {
			interaction.editReply({
				components: [],
				content: "Report timed out."
			});
		}
	});
};

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu
	}
});
