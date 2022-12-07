import { type ChatInputCommandInteraction } from "discord.js";
import GiveawayManager from "../../database/giveaway.js";

export default async function (
	interaction: ChatInputCommandInteraction<"cached">
) {
	const manager = new GiveawayManager(interaction.guildId);
	interaction.reply({
		embeds: [manager.toEmbed((await manager.get(3))!, interaction.client)]
	});
}
