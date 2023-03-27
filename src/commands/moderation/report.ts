import components from "#components";
import { Emojis } from "#constants";
import ConfigManager from "#database/config.js";
import ReportManager from "#database/report.js";
import {
	messageFromURL,
	messageToEmbed,
	parseMessageURL
} from "#helpers/messageHelpers.js";
import { ModalCollector } from "#helpers/ModalCollector.js";
import yesNo from "#helpers/yesNo.js";
import type ConfigModule from "#modules/Config.js";
import { type CommandData, type CommandExport } from "#typings";
import { stripIndents } from "common-tags";
import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	inlineCode,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type GuildMember,
	type Message,
	type ModalSubmitInteraction
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
		| ModalSubmitInteraction<"cached">,
	config: ConfigModule,
	message: Message<true>,
	comment: string,
	anonymous?: boolean
) => {
	const messageEmbed = messageToEmbed(message);

	const anonymousComment = anonymous ? "→ You opted to stay anonymous\n" : "";

	const res = await yesNo({
		medium: interaction,
		data: {
			content: stripIndents`
				${Emojis.FaceInClouds} Are you sure you want to report this message?
				
				${anonymousComment}→ Comment: ${inlineCode(comment.replaceAll("`", "\\`"))}
				
				The message:
			`,
			embeds: [messageEmbed]
		}
	});

	const goToMessageRow = components.createRows(
		components.buttons.url({
			label: "Go to message",
			url: message.url
		})
	);

	if (!res) {
		interaction.editReply({
			components: goToMessageRow,
			content: `Alright! Canceled report on message by ${message.author}.`,
			embeds: []
		});

		return;
	}

	const reportManager = new ReportManager(interaction.guild);
	const guildRelativeId = await reportManager.getNextGuildRelativeId();

	const report = await reportManager.createMessageReport({
		anonymous,
		authorUserId: interaction.user.id,
		authorUserTag: interaction.user.tag,
		comment,
		guildId: message.guildId,
		guildRelativeId,
		targetMessageChannelId: message.channelId,
		targetMessageId: message.id,
		targetUserId: message.author.id,
		targetUserTag: message.author.tag
	});

	await config.postReport(report);

	interaction.editReply({
		components: goToMessageRow,
		content: stripIndents`
			${Emojis.Check} Done! Thank you for keeping the server safe ${Emojis.Sparks}
			
			You reported a message from ${message.author}.
		`
	});
};

const handleMember = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	config: ConfigModule,
	member: GuildMember,
	comment: string,
	anonymous?: boolean
) => {
	const memberString = `${member} - ${inlineCode(member.user.tag)} (${
		member.id
	})`;

	const anonymousComment = anonymous ? "→ You opted to stay anonymous\n" : "";

	const res = await yesNo({
		medium: interaction,
		data: {
			content: stripIndents`
				${Emojis.FaceInClouds} Are you sure you want to report ${memberString}?
				
				${anonymousComment}→ Comment: ${inlineCode(comment.replaceAll("`", "\\`"))}
			`
		}
	});

	if (!res) {
		interaction.editReply({
			components: [],
			content: `Alright! Canceled report on ${memberString}.`
		});

		return;
	}

	const reportManager = new ReportManager(interaction.guild);
	const guildRelativeId = await reportManager.getNextGuildRelativeId();

	const report = await reportManager.createUserReport({
		anonymous,
		authorUserId: interaction.user.id,
		authorUserTag: interaction.user.tag,
		comment,
		guildId: member.guild.id,
		guildRelativeId,
		targetUserId: member.id,
		targetUserTag: member.user.tag
	});

	await config.postReport(report);

	interaction.editReply({
		components: [],
		content: stripIndents`
			${Emojis.Check} Done! Thank you for keeping the server safe ${Emojis.Sparks}
			
			You reported ${memberString}.
		`
	});
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
					${inlineCode(messageURL)}
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
				content: `${
					Emojis.Error
				} The channel from the URL is invalid: ${inlineCode(
					messageURL
				)}`
			});

			return;
		}

		const message = await messageFromURL(interaction.client, parsedURL);

		if (!message) {
			await interaction.reply({
				ephemeral: true,
				content: `${
					Emojis.Error
				} I could not find a message with the URL: ${inlineCode(
					messageURL
				)}`
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
		interaction.reply({
			ephemeral: true,
			content: `${Emojis.NoEntry} Reporting is disabled in this server, as it has not been set up.`
		});

		return;
	}

	const config = await configManager.get();

	if (!config.reportEnabled) {
		interaction.reply({
			ephemeral: true,
			content: `${Emojis.NoEntry} Reporting is disabled in this server.`
		});

		return;
	}

	const modal = components.modals.createReport.component();

	await interaction.showModal(modal);

	const modalCollector = ModalCollector(interaction, modal, {
		time: 180_000
	});

	modalCollector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferReply({ ephemeral: true });

		const comment = modalInteraction.fields.getTextInputValue("comment");

		if (interaction.isMessageContextMenuCommand()) {
			handleMessage(
				modalInteraction,
				config,
				interaction.targetMessage,
				comment
			);
		}

		if (interaction.isUserContextMenuCommand()) {
			handleMember(
				modalInteraction,
				config,
				interaction.targetMember,
				comment
			);
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
