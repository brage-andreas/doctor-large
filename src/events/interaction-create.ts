import markReportUnprocessed from "./buttons/mark-report-unprocessed.js";
import markReportProcessed from "./buttons/mark-report-processed.js";
import previewMessage from "./buttons/preview-message.js";
import enterGiveaway from "./buttons/enter-giveaway.js";
import { Events, type Interaction } from "discord.js";
import acceptPrize from "./buttons/accept-prize.js";
import memberInfo from "./buttons/member-info.js";
import commands from "#scripts/load-commands.js";
import { type EventExport } from "#typings";
import { stripIndents } from "common-tags";
import { Regex } from "#constants";

const execute = async (interaction: Interaction) => {
	if (!interaction.inGuild()) {
		if (interaction.isRepliable()) {
			interaction
				.reply({
					content: stripIndents`
					I see you found my hiding spot...
					Anyways, try finding me inside a server.
				`,
					ephemeral: true,
				})
				.catch(() => null);
		}

		return;
	}

	if (!interaction.inCachedGuild()) {
		if (interaction.isRepliable()) {
			interaction
				.reply({
					content: "Something went wrong...",
					ephemeral: true,
				})
				.catch(() => null);
		}

		return;
	}

	if (interaction.isButton()) {
		if (Regex.AcceptPrizeCustomId.test(interaction.customId)) {
			await acceptPrize(interaction);

			return;
		}

		if (Regex.EnterGiveawayCustomId.test(interaction.customId)) {
			await enterGiveaway(interaction);

			return;
		}

		if (Regex.MarkReportProcessed.test(interaction.customId)) {
			await markReportProcessed(interaction);

			return;
		}

		if (Regex.MarkReportUnprocessed.test(interaction.customId)) {
			await markReportUnprocessed(interaction);

			return;
		}

		if (Regex.MemberInfoCustomId.test(interaction.customId)) {
			await memberInfo(interaction);

			return;
		}

		if (Regex.PreviewMessage.test(interaction.customId)) {
			await previewMessage(interaction);

			return;
		}

		return;
	}

	if (!interaction.isChatInputCommand() && !interaction.isContextMenuCommand() && !interaction.isAutocomplete()) {
		return;
	}

	const command = commands.get(interaction.commandName);

	if (!command) {
		// this should never happen
		throw new Error(`Command '${interaction.commandName}' not found in command map`);
	}

	if (interaction.isChatInputCommand()) {
		if (!command.handle.chatInput) {
			throw new TypeError(
				`Command '${interaction.commandName}' called as type 'chatInput' is missing handle of same type`
			);
		}

		await command.handle.chatInput(interaction);
	} else if (interaction.isAutocomplete()) {
		if (!command.handle.autocomplete) {
			throw new TypeError(
				`Command '${interaction.commandName}' called as type 'autocomplete' is missing handle of same type`
			);
		}

		await command.handle.autocomplete(interaction);
	} else if (interaction.isContextMenuCommand()) {
		if (!command.handle.contextMenu) {
			throw new TypeError(
				`Command '${interaction.commandName}' called as type 'contextMenu' is missing handle of same type`
			);
		}

		await command.handle.contextMenu(interaction);
	}
};

export const getEvent: EventExport = () => ({
	event: Events.InteractionCreate,
	execute,
});
