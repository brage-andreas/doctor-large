import { RegExp } from "#constants";
import { getCommandFromCommandMap } from "#helpers/scripts/commandMap.js";
import { stripIndents } from "common-tags";
import { type Interaction } from "discord.js";
import acceptPrize from "./giveawayListeners/acceptPrize.js";
import enterGiveaway from "./giveawayListeners/enterGiveaway.js";

export async function run(interaction: Interaction) {
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
		const {
			AcceptPrizeCustomId: ACCEPT_PRIZE_CUSTOM_ID,
			EnterGiveawayCustomId: ENTER_GIVEAWAY_CUSTOM_ID
		} = RegExp;

		if (ENTER_GIVEAWAY_CUSTOM_ID.test(interaction.customId)) {
			await enterGiveaway(interaction);
		} else if (ACCEPT_PRIZE_CUSTOM_ID.test(interaction.customId)) {
			await acceptPrize(interaction);
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

	const command = getCommandFromCommandMap(interaction.commandName);

	if (!command) {
		// this should never happen
		throw new Error(
			`Commands mismatch: ${interaction.commandName} not in command map`
		);
	}

	if (interaction.isChatInputCommand()) {
		if (!command.handle.chatInput) {
			throw new Error(
				`Commands mismatch: ${interaction.commandName} called as 'chatInput' but has no 'chatInput' handle`
			);
		}

		return void (await command.handle.chatInput(interaction));
	}

	if (interaction.isAutocomplete()) {
		if (!command.handle.autocomplete) {
			throw new Error(
				`Commands mismatch: ${interaction.commandName} called as 'autocomplete' but has no 'autocomplete' handle`
			);
		}

		return void (await command.handle.autocomplete(interaction));
	}

	if (interaction.isContextMenuCommand()) {
		if (!command.handle.contextMenu) {
			throw new Error(
				`Commands mismatch: ${interaction.commandName} called as 'contextMenu' but has no 'contextMenu' handle`
			);
		}

		return void (await command.handle.contextMenu(interaction));
	}
}
