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
import sendToAutocompleteFindGiveaway from "./mod.autocompleteFindGiveaway.js";
import sendToCreate from "./mod.create.js";
import sendToDashboard from "./mod.dashboard.js";
import sendToEdit from "./mod.edit.js";

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
					autocomplete: true
				}
			]
		},
		{
			name: "create",
			description: "Create and customise a new giveaway.",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "title",
					type: ApplicationCommandOptionType.String,
					description: oneLine`
						The title for the giveaway.
						For example "Christmas Giveaway 2022".
					`,
					required: true
				},
				{
					name: "description",
					type: ApplicationCommandOptionType.String,
					description: oneLine`
						The description for the giveaway.
						Put any addition info here.
						[None]
					`
				},
				{
					name: "number-of-winners",
					type: ApplicationCommandOptionType.Integer,
					description: "How many winners there should be. [1]",
					min_value: 1
				}
			]
		},
		{
			name: "edit",
			description: "Edit an already existing giveaway.",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "giveaway-to-edit",
					type: ApplicationCommandOptionType.Integer,
					description: "Which giveaway should be edited.",
					autocomplete: true
				},
				{
					name: "new-title",
					type: ApplicationCommandOptionType.String,
					description:
						"The new (and improved) title for the giveaway. Typos happen."
				},
				{
					name: "new-description",
					type: ApplicationCommandOptionType.String,
					description:
						"The new (and improved) description for the giveaway."
				},
				{
					name: "new-number-of-winners",
					type: ApplicationCommandOptionType.Integer,
					description:
						"How many winners there should have actually been.",
					min_value: 1
				}
			]
		}
	]
};

const run = async (interaction: CommandModuleInteractions) => {
	if (interaction.isAutocomplete()) {
		await sendToAutocompleteFindGiveaway(interaction);

		return;
	}

	if (!interaction.isChatInputCommand()) {
		return;
	}

	const subcommand = interaction.options.getSubcommand();

	if (subcommand === "dashboard") {
		sendToDashboard(interaction);
	} else if (subcommand === "create") {
		await sendToCreate(interaction);
	} else if (subcommand === "edit") {
		await sendToEdit(interaction);
	}
};

export const getCommand: () => Command = () => ({
	data,
	run
});
