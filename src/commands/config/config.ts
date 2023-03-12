import { HIDE_OPTION } from "#constants";
import ConfigManager from "#database/config.js";
import Logger from "#logger";
import { type CommandData, type CommandExport } from "#typings";
import {
	PermissionFlagsBits,
	type ChatInputCommandInteraction
} from "discord.js";
import toConfigDashboard from "./configModules/configDashboard.js";
import toNoConfigDashboard from "./configModules/noConfigDashboard.js";

const data: CommandData = {
	chatInput: {
		name: "config",
		description: "View and edit this server's config.",
		dm_permission: false,
		default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
		options: [HIDE_OPTION]
	}
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	const hide = interaction.options.getBoolean("hide") ?? true;

	await interaction.deferReply({ ephemeral: hide });

	const configManager = new ConfigManager(interaction.guild);

	const logger = new Logger({ interaction, prefix: "CONFIG" });

	await configManager
		.validate()
		.then(() => {
			logger.log("Opened config dashboard");

			toConfigDashboard(interaction, configManager);
		})
		.catch(() => {
			logger.log("Opened no config dashboard");

			toNoConfigDashboard(interaction, configManager);
		});
};

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput
	}
});
