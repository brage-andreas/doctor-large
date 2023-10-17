import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	type ChatInputCommandInteraction,
	type ContextMenuCommandInteraction,
	type GuildMember,
	type Message,
	type ModalSubmitInteraction,
	inlineCode,
} from "discord.js";
import { ModalCollector, messageFromURL, messageToEmbed, parseMessageURL, squash, yesNo } from "#helpers";
import { type CommandData, type CommandExport } from "#typings";
import type ConfigModule from "#modules/config.js";
import ConfigManager from "#database/config.js";
import ReportManager from "#database/report.js";
import components from "#discord-components";
import { stripIndents } from "common-tags";
import { Emojis } from "#constants";
import Logger from "#logger";

const data: CommandData = {
	chatInput: {
		description: "Report a member or a user to the moderators.",
		dm_permission: false,
		name: "report",
		options: [
			{
				description: "Report a message to the moderators.",
				name: "message",
				options: [
					{
						description: "The URL to the message.",
						name: "message-url",
						required: true,
						type: ApplicationCommandOptionType.String,
					},
					{
						description: "A comment to help the moderators.",
						name: "comment",
						required: true,
						type: ApplicationCommandOptionType.String,
					},
					{
						description: "Hide your identity to the moderators.",
						name: "anonymous",
						type: ApplicationCommandOptionType.Boolean,
					},
				],
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				description: "Report a user to the moderators",
				name: "user",
				options: [
					{
						description: "The user to target.",
						name: "user",
						required: true,
						type: ApplicationCommandOptionType.User,
					},
					{
						description: "A comment to help the moderators.",
						name: "comment",
						required: true,
						type: ApplicationCommandOptionType.String,
					},
					{
						description: "Hide your identity to the moderators. (False)",
						name: "anonymous",
						type: ApplicationCommandOptionType.Boolean,
					},
				],
				type: ApplicationCommandOptionType.Subcommand,
			},
		],
	},
	messageContextMenu: {
		name: "Report message",
		type: ApplicationCommandType.Message,
	},
	userContextMenu: {
		name: "Report user",
		type: ApplicationCommandType.User,
	},
};

const handleMessage = async (
	interaction: ChatInputCommandInteraction<"cached"> | ModalSubmitInteraction<"cached">,
	config: ConfigModule,
	message: Message<true>,
	comment: string,
	anonymous?: boolean
) => {
	const messageEmbed = messageToEmbed(message);

	const reportManager = new ReportManager(interaction.guild);

	const hasRecentReport = await reportManager.hasRecentReport({
		targetMessageId: message.id,
		targetUserId: message.author.id,
	});

	const response = await yesNo({
		data: {
			content: squash(stripIndents`
				## ${Emojis.FaceInClouds} Are you sure you want to report this message?
				${
					hasRecentReport
						? `${Emojis.Warn} **This member or message has recently been reported**. Multiple reports may not be necessary.`
						: ""
				}
				
				${anonymous ? "* You opted to stay anonymous" : ""}
				* Comment: ${inlineCode(comment.replaceAll("`", "\\`"))}
				
				The message:
			`),
			embeds: [messageEmbed],
		},
		medium: interaction,
	});

	const goToMessageRow = components.createRows(
		components.buttons.url({
			label: "Go to message",
			url: message.url,
		})
	);

	if (!response) {
		interaction
			.editReply({
				components: goToMessageRow,
				content: `Alright! Canceled report on message by ${message.author.toString()}.`,
				embeds: [],
			})
			.catch(() => null);

		return;
	}

	const guildRelativeId = await reportManager.getNextGuildRelativeId();

	const report = await reportManager.createMessageReport({
		anonymous,
		authorUserId: interaction.user.id,
		authorUsername: interaction.user.tag,
		comment,
		guildId: message.guildId,
		guildRelativeId,
		targetMessageChannelId: message.channelId,
		targetMessageId: message.id,
		targetUserId: message.author.id,
		targetUsername: message.author.tag,
	});

	await config.postReport(report);

	new Logger({ interaction, label: "REPORT" }).log(
		`Reported message ${message.id} by ${message.author.tag} (${message.author.id})`
	);

	interaction
		.editReply({
			components: goToMessageRow,
			content: stripIndents`
			${Emojis.Check} Done! Thank you for keeping the server safe ${Emojis.Sparks}
			
			You reported a message from ${message.author}.
		`,
		})
		.catch(() => null);
};

const handleMember = async (
	interaction: ChatInputCommandInteraction<"cached"> | ModalSubmitInteraction<"cached">,
	config: ConfigModule,
	member: GuildMember,
	comment: string,
	anonymous?: boolean
) => {
	const memberString = `${member.toString()} - ${inlineCode(member.user.tag)} (${member.id})`;

	const reportManager = new ReportManager(interaction.guild);

	const hasRecentReport = await reportManager.hasRecentReport({
		targetUserId: member.id,
	});

	const response = await yesNo({
		data: {
			content: squash(stripIndents`
				${Emojis.FaceInClouds} Are you sure you want to report ${memberString}?
				${
					hasRecentReport
						? `${Emojis.Warn} **This member has recently been reported**. Multiple reports may not be necessary.`
						: ""
				}

				${anonymous ? "* You opted to stay anonymous" : ""}
				* Comment: ${inlineCode(comment.replaceAll("`", "\\`"))}
			`),
		},
		medium: interaction,
	});

	if (!response) {
		interaction
			.editReply({
				components: [],
				content: `Alright! Canceled report on ${memberString}.`,
			})
			.catch(() => null);

		return;
	}

	const guildRelativeId = await reportManager.getNextGuildRelativeId();

	const report = await reportManager.createUserReport({
		anonymous,
		authorUserId: interaction.user.id,
		authorUsername: interaction.user.tag,
		comment,
		guildId: member.guild.id,
		guildRelativeId,
		targetUserId: member.id,
		targetUsername: member.user.tag,
	});

	await config.postReport(report);

	new Logger({ interaction, label: "REPORT" }).log(`Reported member ${member.user.tag} (${member.user.id})`);

	interaction
		.editReply({
			components: [],
			content: stripIndents`
			${Emojis.Check} Done! Thank you for keeping the server safe ${Emojis.Sparks}
			
			You reported ${memberString}.
		`,
		})
		.catch(() => null);
};

const chatInput = async (interaction: ChatInputCommandInteraction<"cached">) => {
	await interaction.deferReply({ ephemeral: true });

	const configManager = new ConfigManager(interaction.guild);

	const validation = await configManager
		.validate()
		.then(() => true)
		.catch(() => false);

	if (!validation) {
		interaction
			.editReply({
				content: `${Emojis.NoEntry} Reporting is disabled in this server, as it has not been set up.`,
			})
			.catch(() => null);

		return;
	}

	const config = await configManager.get();

	if (!config.reportEnabled) {
		interaction
			.editReply({
				content: `${Emojis.NoEntry} Reporting is disabled in this server.`,
			})
			.catch(() => null);

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
				`,
			});

			return;
		}

		if (parsedURL.guildId !== interaction.guildId) {
			await interaction.editReply({
				content: `${Emojis.Error} The message is not from this server.`,
			});

			return;
		}

		const channel = interaction.guild.channels.cache.get(parsedURL.channelId);

		if (!channel?.isTextBased()) {
			await interaction.editReply({
				content: `${Emojis.Error} The channel from the URL is invalid: ${inlineCode(messageURL)}`,
			});

			return;
		}

		const message = await messageFromURL(interaction.client, parsedURL);

		if (!message) {
			await interaction.reply({
				content: `${Emojis.Error} I could not find a message with the URL: ${inlineCode(messageURL)}`,
				ephemeral: true,
			});

			return;
		}

		void handleMessage(interaction, config, message, comment, anonymous);
	}
};

const contextMenu = async (interaction: ContextMenuCommandInteraction<"cached">) => {
	const configManager = new ConfigManager(interaction.guild);

	const validation = await configManager
		.validate()
		.then(() => true)
		.catch(() => false);

	if (!validation) {
		interaction
			.reply({
				content: `${Emojis.NoEntry} Reporting is disabled in this server, as it has not been set up.`,
				ephemeral: true,
			})
			.catch(() => null);

		return;
	}

	const config = await configManager.get();

	if (!config.reportEnabled) {
		interaction
			.reply({
				content: `${Emojis.NoEntry} Reporting is disabled in this server.`,
				ephemeral: true,
			})
			.catch(() => null);

		return;
	}

	const modal = components.modals.createReport.component();

	await interaction.showModal(modal);

	const modalCollector = ModalCollector(interaction, modal, {
		time: 180_000,
	});

	modalCollector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferReply({ ephemeral: true });

		const comment = modalInteraction.fields.getTextInputValue("comment");

		if (interaction.isMessageContextMenuCommand()) {
			void handleMessage(modalInteraction, config, interaction.targetMessage, comment);
		}

		if (interaction.isUserContextMenuCommand()) {
			void handleMember(modalInteraction, config, interaction.targetMember, comment);
		}
	});
};

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu,
	},
});
