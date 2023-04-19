import components from "#components";
import GiveawayManager from "#database/giveaway.js";
import { ModalCollector } from "#helpers/ModalCollector.js";
import Logger from "#logger";
import { type ChatInputCommandInteraction } from "discord.js";
import toDashboard from "./dashboard.js";

export default async function (
	interaction: ChatInputCommandInteraction<"cached">
) {
	const modal = components.modals.createGiveaway.component();

	await interaction.showModal(modal);

	const collector = ModalCollector(interaction, modal, {
		time: 180_000
	});

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferReply({ ephemeral: true });

		if (!modalInteraction.fields.fields.size) {
			return;
		}

		const giveawayManager = new GiveawayManager(interaction.guild);

		const title = modalInteraction.fields.getTextInputValue("title");

		const description =
			modalInteraction.fields.getTextInputValue("description");

		const winnerQuantity = Number(
			modalInteraction.fields.getTextInputValue("winnerQuantity")
		);

		const nextGuildRelativeId =
			await giveawayManager.getNextGuildRelativeId();

		const { id } = await giveawayManager.create({
			guildRelativeId: nextGuildRelativeId,
			winnerQuantity,
			hostUserTag: interaction.user.tag,
			hostUserId: interaction.user.id,
			description,
			guildId: interaction.guildId,
			title
		});

		new Logger({ label: "GIVEAWAY", interaction }).log(
			`Created giveaway with ID #${id}`
		);

		toDashboard(modalInteraction, id);
	});
}
