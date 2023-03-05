import { RegExp } from "#constants";
import commands from "#scripts/loadCommands.js";
import { type EventExport } from "#typings";
import { stripIndents } from "common-tags";
import { Events, type Interaction } from "discord.js";
import acceptPrize from "./giveawayListeners/acceptPrize.js";
import enterGiveaway from "./giveawayListeners/enterGiveaway.js";

const execute = async (interaction: Interaction) => {
	if (!interaction.inGuild()) {
		if (interaction.isRepliable()) {
			interaction.reply({
				content: stripIndents`
					I see you found my hiding spot...
					Anyways, try finding me inside a server.
				`,
				ephemeral: true
			});
		}

		return;
	}

	if (!interaction.inCachedGuild()) {
		if (interaction.isRepliable()) {
			interaction.reply({
				content: "Something went wrong...",
				ephemeral: true
			});
		}

		return;
	}

	if (interaction.isButton()) {
		const { AcceptPrizeCustomId, EnterGiveawayCustomId } = RegExp;

		if (EnterGiveawayCustomId.test(interaction.customId)) {
			return await enterGiveaway(interaction);
		}

		if (AcceptPrizeCustomId.test(interaction.customId)) {
			return await acceptPrize(interaction);
		}

		return;
	}

	if (
		!interaction.isChatInputCommand() &&
		!interaction.isContextMenuCommand() &&
		!interaction.isAutocomplete()
	) {
		return;
	}

	const command = commands.get(interaction.commandName);

	if (!command) {
		// this should never happen
		throw new Error(
			`Command '${interaction.commandName}' not found in command map`
		);
	}

	if (interaction.isChatInputCommand()) {
		if (!command.handle.chatInput) {
			throw new Error(
				`Command '${interaction.commandName}' called as type 'chatInput' is missing handle of same type`
			);
		}

		return void (await command.handle.chatInput(interaction));
	}

	if (interaction.isAutocomplete()) {
		if (!command.handle.autocomplete) {
			throw new Error(
				`Command '${interaction.commandName}' called as type 'autocomplete' is missing handle of same type`
			);
		}

		return void (await command.handle.autocomplete(interaction));
	}

	if (interaction.isContextMenuCommand()) {
		if (!command.handle.contextMenu) {
			throw new Error(
				`Command '${interaction.commandName}' called as type 'contextMenu' is missing handle of same type`
			);
		}

		return void (await command.handle.contextMenu(interaction));
	}
};

export const getEvent: () => EventExport = () => ({
	event: Events.InteractionCreate,
	execute
});
