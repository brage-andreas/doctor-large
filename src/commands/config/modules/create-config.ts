import { type ButtonInteraction, type ChatInputCommandInteraction, ComponentType } from "discord.js";
import toConfigDashboard from "./dashboard/dashboard.js";
import type ConfigManager from "#database/config.js";
import components from "#components";
import { Emojis } from "#constants";

export default async function toCreateConfig(
	interaction: ButtonInteraction<"cached"> | ChatInputCommandInteraction<"cached">,
	configManager: ConfigManager
) {
	const rows = components.createRows(components.buttons.create.component("config"));

	const message = await interaction.editReply({
		components: rows,
		content: "This server does not have a config.",
	});

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
		max: 1,
		time: 120_000,
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction
			.reply({
				content: `${Emojis.NoEntry} This button is not for you.`,
				ephemeral: true,
			})
			.catch(() => null);
	});

	collector.on("collect", async (buttonInteraction) => {
		await buttonInteraction.deferUpdate();

		await configManager.create();

		void toConfigDashboard(buttonInteraction, configManager);
	});

	collector.on("end", (_, reason) => {
		if (reason === "time") {
			interaction.editReply({ components: [] }).catch(() => null);
		}
	});
}
