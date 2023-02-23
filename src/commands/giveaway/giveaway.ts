import { EMOJIS } from "#constants";
import hideOption from "#helpers/hideOption.js";
import Logger from "#logger";
import { type Command, type CommandModuleInteractions } from "#typings";
import { oneLine } from "common-tags";
import {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import sendToAutocompleteGiveaway from "./giveawayModules/autocompleteGiveaway.js";
import sendToCreate from "./giveawayModules/create.js";
import sendToDashboard from "./giveawayModules/dashboard.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
	description: "Configuration for giveaways.",
	dm_permission: false,
	name: "giveaway",
	options: [
		{
			name: "dashboard",
			type: ApplicationCommandOptionType.Subcommand,
			description: oneLine`
			Shows a dashboard where you can view current giveaways,
			or a specific giveaway to manage it.
			`,
			options: [
				{
					autocomplete: true,
					description:
						"Which giveaway should be managed in the dashboard.",
					name: "giveaway",
					required: true,
					type: ApplicationCommandOptionType.Integer
				},
				hideOption
			]
		},
		{
			description: "Create and customise a new giveaway.",
			name: "create",
			type: ApplicationCommandOptionType.Subcommand,
			options: [hideOption]
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

	const hide = interaction.options.getBoolean("hide") ?? true;

	switch (interaction.options.getSubcommand()) {
		case "dashboard": {
			await interaction.deferReply({ ephemeral: hide });
			const id = interaction.options.getInteger("giveaway", true);

			if (id === -1) {
				interaction.editReply({
					content: `${EMOJIS.SLEEP} Whoa so empty — there are no giveaways`
				});

				break;
			}

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Opened dashboard of giveaway with ID #${id}`
			);

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
