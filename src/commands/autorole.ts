import {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
	type ApplicationCommandData
} from "discord.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../typings/index.js";

ApplicationCommandOptionType;

const data: ApplicationCommandData = {
	name: "autorole",
	description: "Configuration for this servers autorole.",
	defaultMemberPermissions:
		PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild,
	dmPermission: false,
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
