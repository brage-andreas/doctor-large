import { Emojis, HIDE_OPTION } from "#constants";
import Logger from "#logger";
import { type CommandData, type CommandExport } from "#typings";
import { oneLine } from "common-tags";
import {
	ApplicationCommandOptionType,
	PermissionFlagsBits,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction
} from "discord.js";
import sendToAutocompleteGiveaway from "./giveawayModules/autocompleteGiveaway.js";
import sendToCreate from "./giveawayModules/create.js";
import sendToDashboard from "./giveawayModules/dashboard.js";

const data: CommandData = {
	commandName: "giveaway",
	chatInput: {
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
					HIDE_OPTION
				]
			},
			{
				description: "Create and customise a new giveaway.",
				name: "create",
				type: ApplicationCommandOptionType.Subcommand,
				options: [HIDE_OPTION]
			}
		]
	}
};

const chatInput = async (
	interaction: ChatInputCommandInteraction<"cached">
) => {
	const hide = interaction.options.getBoolean("hide") ?? true;

	switch (interaction.options.getSubcommand()) {
		case "dashboard": {
			await interaction.deferReply({ ephemeral: hide });
			const id = interaction.options.getInteger("giveaway", true);

			if (id === -1) {
				interaction.editReply({
					content: `${Emojis.Sleep} Whoa so empty — there are no giveaways`
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

const autocomplete = async (interaction: AutocompleteInteraction<"cached">) => {
	await sendToAutocompleteGiveaway(interaction);
};

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput,
		autocomplete
	}
});
