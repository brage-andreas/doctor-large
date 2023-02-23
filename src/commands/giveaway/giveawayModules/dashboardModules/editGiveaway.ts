import components from "#components";
import { EMOJIS } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { ModalCollector } from "#helpers/ModalCollector.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import toDashboard from "../dashboard.js";

export default async function toEditGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.reply({
			components: [],
			ephemeral: true,
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const editGiveawayModal = components.modals.editGiveaway.component(
		giveaway.guildRelativeId,
		giveaway.title,
		giveaway.description,
		giveaway.winnerQuantity
	);

	const success = await interaction
		.showModal(editGiveawayModal)
		.then(() => true)
		.catch(() => false);

	if (!success) {
		await interaction.editReply({
			content: `${EMOJIS.ERROR} Something went wrong trying to edit the giveaway. Try again.`
		});
	}

	const collector = ModalCollector(interaction, editGiveawayModal, {
		time: 180_000
	});

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const title = modalInteraction.fields.getTextInputValue("newTitle");

		const rawGiveawayDescription =
			modalInteraction.fields.getTextInputValue("newDescription");

		const description = rawGiveawayDescription
			.split("\n")
			.slice(0, 20)
			.join("\n");

		const winnerQuantity =
			Number(
				modalInteraction.fields.getTextInputValue("newWinnerQuantity")
			) ?? 1;

		if (
			title !== giveaway.title ||
			description !== giveaway.description ||
			winnerQuantity !== giveaway.winnerQuantity
		) {
			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Edited giveaway #${id}`
			);

			await giveaway.edit({
				title,
				description,
				winnerQuantity,
				nowOutdated: {
					publishedMessage: true,
					winnerMessage: true
				}
			});
		}

		await toDashboard(modalInteraction, id);
	});
}
