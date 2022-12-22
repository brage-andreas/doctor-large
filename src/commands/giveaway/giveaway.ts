import { oneLine } from "common-tags";
import {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../../typings/index.js";
import sendToAutocompleteGiveaway from "./mod.autocompleteGiveaway.js";
import sendToCreate from "./mod.create.js";
import sendToDashboard from "./mod.dashboard.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "giveaway",
	dm_permission: false,
	description: "Configuration for giveaways.",
	default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
	options: [
		{
			name: "dashboard",
			description: oneLine`
				Shows a dashboard where you can view current giveaways,
				or a specific giveaway to manage it.
			`,
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "giveaway",
					type: ApplicationCommandOptionType.Integer,
					description:
						"Which giveaway should be managed in the dashboard.",
					autocomplete: true,
					required: true
				}
			]
		},
		{
			name: "create",
			description: "Create and customise a new giveaway.",
			type: ApplicationCommandOptionType.Subcommand
		}
	]
};

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		if (interaction.isAutocomplete()) {
			await sendToAutocompleteGiveaway(interaction);
		}

		return;
	}

	switch (interaction.options.getSubcommand()) {
		case "dashboard": {
			await interaction.deferReply();
			const id = interaction.options.getInteger("giveaway", true);

			sendToDashboard(interaction, id);
			break;
		}

		case "create": {
			await sendToCreate(interaction);
			break;
		}
	}
};

export const getCommand: () => Command = () => ({
	data,
	run
});
