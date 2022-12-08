import { type ChatInputCommandInteraction } from "discord.js";

export default async function (
	interaction: ChatInputCommandInteraction,
	customId?: number
) {
	const id = customId && interaction.options.getInteger("giveaway", true);

	await interaction.reply({ content: "WIP", ephemeral: true });
	id;
}
