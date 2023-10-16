import { type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import toConfigDashboard from "./modules/dashboard/dashboard.js";
import { type CommandData, type CommandExport } from "#typings";
import toCreateConfig from "./modules/create-config.js";
import ConfigManager from "#database/config.js";
import { HIDE_OPTION } from "#constants";
import Logger from "#logger";

const data: CommandData = {
	chatInput: {
		default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
		description: "View and edit this server's config.",
		dm_permission: false,
		name: "config",
		options: [HIDE_OPTION],
	},
};

const chatInput = async (interaction: ChatInputCommandInteraction<"cached">) => {
	const hide = interaction.options.getBoolean("hide") ?? true;

	await interaction.deferReply({ ephemeral: hide });

	const configManager = new ConfigManager(interaction.guild);

	const logger = new Logger({ interaction, label: "CONFIG" });

	await configManager
		.validate()
		.then(() => {
			logger.log("Opened config dashboard");

			void toConfigDashboard(interaction, configManager);
		})
		.catch(() => {
			logger.log("Opened no config dashboard");

			void toCreateConfig(interaction, configManager);
		});
};

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		chatInput,
	},
});
