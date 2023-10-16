import { type ChatInputCommandInteraction } from "discord.js";
import GiveawayManager from "#database/giveaway.js";
import { ModalCollector } from "#helpers";
import toDashboard from "./dashboard.js";
import components from "#components";
import Logger from "#logger";

export default async function (interaction: ChatInputCommandInteraction<"cached">) {
	const modal = components.modals.createGiveaway.component();

	await interaction.showModal(modal);

	const collector = ModalCollector(interaction, modal, {
		time: 180_000,
	});

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferReply({ ephemeral: true });

		if (modalInteraction.fields.fields.size === 0) {
			return;
		}

		const giveawayManager = new GiveawayManager(interaction.guild);

		const title = modalInteraction.fields.getTextInputValue("title");

		const description = modalInteraction.fields.getTextInputValue("description");

		const winnerQuantity = Number(modalInteraction.fields.getTextInputValue("winnerQuantity"));

		const nextGuildRelativeId = await giveawayManager.getNextGuildRelativeId();

		const { id } = await giveawayManager.create({
			description,
			guildId: interaction.guildId,
			guildRelativeId: nextGuildRelativeId,
			hostUserId: interaction.user.id,
			hostUsername: interaction.user.tag,
			title,
			winnerQuantity,
		});

		new Logger({ interaction, label: "GIVEAWAY" }).log(`Created giveaway with ID #${id}`);

		void toDashboard(modalInteraction, id);
	});
}
