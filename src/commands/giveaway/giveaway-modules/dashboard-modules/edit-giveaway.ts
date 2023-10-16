import { type ButtonInteraction, type RepliableInteraction, time } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import toDashboard from "../giveaway-dashboard.js";
import { stripIndents } from "common-tags";
import { ModalCollector } from "#helpers";
import components from "#components";
import { Emojis } from "#constants";
import Logger from "#logger";

export default async function toEditGiveaway(
	interaction: ButtonInteraction<"cached">,
	originalInteraction: RepliableInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.reply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: [],
			ephemeral: true,
		});

		return;
	}

	const editGiveawayModal = components.modals.editGiveaway.component({
		guildRelativeId: giveaway.guildRelativeId,
		oldDescription: giveaway.description,
		oldTitle: giveaway.title,
		oldWinnerQuantity: giveaway.winnerQuantity,
	});

	const success = await interaction
		.showModal(editGiveawayModal)
		.then(() => true)
		.catch((error) => {
			new Logger({ interaction, label: "EDIT GIVEAWAY" }).log("Failed to show edit modal:", error);

			return false;
		});

	if (!success) {
		await interaction.reply({
			content: `${Emojis.Error} Something went wrong trying to edit the giveaway. Try again.`,
			ephemeral: true,
		});

		return;
	}

	const cancel = components.createRows(components.buttons.cancel.component());

	const message = await originalInteraction.editReply({
		components: cancel,
		content: `Editing the giveaway... (time limit ${time(Date.now() + 300_000, "R")})`,
		embeds: [],
	});

	const collector = ModalCollector(interaction, editGiveawayModal, {
		time: 300_000,
	});

	const cancelCollector = message.createMessageComponentCollector({
		filter: (index) => index.user.id === interaction.user.id,
		max: 1,
		time: 290_000,
	});

	cancelCollector.on("collect", async (index) => {
		await index.deferUpdate();
		collector.stop("manual");

		await toDashboard(index, id);
	});

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const title = modalInteraction.fields.getTextInputValue("newTitle");

		const rawGiveawayDescription = modalInteraction.fields.getTextInputValue("newDescription");

		const description = rawGiveawayDescription.split("\n").slice(0, 20).join("\n");

		const winnerQuantity = Number(modalInteraction.fields.getTextInputValue("newWinnerQuantity")) || 1;

		if (
			title !== giveaway.title ||
			description !== giveaway.description ||
			winnerQuantity !== giveaway.winnerQuantity
		) {
			new Logger({ interaction, label: "GIVEAWAY" }).log(`Edited giveaway #${id}`);

			await giveaway.edit({
				description,
				nowOutdated: {
					announcementMessage: true,
					winnerMessage: true,
				},
				title,
				winnerQuantity,
			});
		}

		await toDashboard(modalInteraction, id);
	});
}
