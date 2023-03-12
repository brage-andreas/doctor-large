import components from "#components";
import { Emojis } from "#constants";
import type ConfigManager from "#database/config.js";
import {
	ComponentType,
	type ButtonInteraction,
	type ChatInputCommandInteraction
} from "discord.js";
import toConfigDashboard from "./configDashboard.js";

export default async function toNoConfigDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| ChatInputCommandInteraction<"cached">,
	configManager: ConfigManager
) {
	const rows = components.createRows(
		components.buttons.create.component().setLabel("Create config")
	);

	const msg = await interaction.editReply({
		content: "This server does not have a config.",
		components: rows
	});

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		max: 1
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction.reply({
			content: `${Emojis.NoEntry} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		await buttonInteraction.deferUpdate();

		await configManager.create();

		toConfigDashboard(buttonInteraction, configManager);
	});

	collector.on("end", (_, reason) => {
		if (reason === "time") {
			interaction.editReply({ components: [] });
		}
	});
}
