import {
	ApplicationCommandOptionType,
	type AutocompleteInteraction,
	type ChatInputCommandInteraction,
	PermissionFlagsBits,
} from "discord.js";
import sendToAutocompleteGiveaway from "./giveawayModules/autocompleteGiveaway.js";
import { type CommandData, type CommandExport } from "#typings";
import sendToDashboard from "./giveawayModules/dashboard.js";
import sendToCreate from "./giveawayModules/create.js";
import { Emojis, HIDE_OPTION } from "#constants";
import { oneLine } from "common-tags";
import Logger from "#logger";

const data: CommandData = {
	chatInput: {
		default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
		description: "Configuration for giveaways.",
		dm_permission: false,
		name: "giveaway",
		options: [
			{
				description: oneLine`
					Shows a dashboard where you can view current giveaways,
					or a specific giveaway to manage it.
				`,
				name: "dashboard",
				options: [
					{
						autocomplete: true,
						description: "Which giveaway should be managed in the dashboard.",
						name: "giveaway",
						required: true,
						type: ApplicationCommandOptionType.Integer,
					},
					HIDE_OPTION,
				],
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				description: "Create and customise a new giveaway.",
				name: "create",
				options: [HIDE_OPTION],
				type: ApplicationCommandOptionType.Subcommand,
			},
		],
	},
};

const chatInput = async (interaction: ChatInputCommandInteraction<"cached">) => {
	const hide = interaction.options.getBoolean("hide") ?? true;

	switch (interaction.options.getSubcommand()) {
		case "dashboard": {
			await interaction.deferReply({ ephemeral: hide });
			const id = interaction.options.getInteger("giveaway", true);

			if (id === -1) {
				interaction
					.editReply({
						content: `${Emojis.Sleep} Whoa so empty — there are no giveaways`,
					})
					.catch(() => null);

				break;
			}

			new Logger({ interaction, label: "GIVEAWAY" }).log(`Opened dashboard of giveaway with ID #${id}`);

			void sendToDashboard(interaction, id);
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

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		autocomplete,
		chatInput,
	},
});
