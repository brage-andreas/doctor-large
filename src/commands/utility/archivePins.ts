import { type Command, type CommandModuleInteractions } from "#typings";
import {
	ApplicationCommandType,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "archive_pins",
	dm_permission: false,
	description: "Automatically archive pins to a separate channel.",
	default_member_permissions: PermissionFlagsBits.ManageMessages.toString(),
	type: ApplicationCommandType.ChatInput
};

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	await interaction.deferReply({ ephemeral: true });
};

export const getCommand: () => Command = () => ({
	data,
	run
});
