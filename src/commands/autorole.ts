import {
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../typings/index.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "autorole",
	description: "Configuration for this servers autorole.",
	default_member_permissions: (
		PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild
	).toString(),
	dm_permission: false,
	options: []
};

const run = (interaction: CommandModuleInteractions) => {
	if (!interaction.isRepliable()) {
		return;
	}

	interaction.reply({ content: "test" });
};

export const getCommand: () => Command = () => ({
	data,
	run
});
