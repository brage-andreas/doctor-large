import { oneLine } from "common-tags";
import { type Interaction } from "discord.js";
import commandMap from "../helpers/scripts/commandMap.js";

export async function run(interaction: Interaction) {
	if (!interaction.inGuild()) {
		// All interactions are repliable except autocomplete
		if (interaction.isRepliable()) {
			// Give it some personality
			const randomGreetLine = () => {
				const greetings = [
					"Oh, hi!",
					"Heeey!",
					"Hellooo!",
					"God, you scared me!"
				];

				return greetings.at(
					Math.floor(Math.random() * greetings.length)
				);
			};

			interaction.reply({
				content: oneLine`
					${randomGreetLine()}
					I see you found my hiding spot...
					Anyways, try finding me inside a server.
				`,
				ephemeral: true
			});
		}

		return;
	}

	if (!interaction.inCachedGuild()) {
		// All interactions are repliable except autocomplete
		if (interaction.isRepliable()) {
			interaction.reply({
				content: oneLine`
					Something went wrong...
					Maybe I'm out of wine 🤔
				`,
				ephemeral: true
			});
		}

		return;
	}

	if (
		!interaction.isChatInputCommand() &&
		!interaction.isContextMenuCommand() &&
		!interaction.isAutocomplete()
	) {
		// Others are handled through collectors
		return;
	}

	const command = commandMap.get(interaction.commandName);

	if (!command) {
		// this should never happen
		throw new Error(
			`Commands mismatch: ${interaction.commandName} not in command map`
		);
	}

	void (await command.run(interaction));
}
