import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { giveawayComponents } from "../../../components/index.js";
import type GiveawayManager from "../../../database/giveaway.js";
import lastEditBy from "../../../helpers/lastEdit.js";
import Logger from "../../../logger/logger.js";
import toDashboard from "../mod.dashboard.js";

export default async function toEditGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const editGiveawayModal = giveawayComponents.edit.editOptionsModal(
		giveaway.id,
		giveaway.title,
		giveaway.description,
		giveaway.winnerQuantity
	);

	await interaction.showModal(editGiveawayModal);

	const modalInteraction = await interaction
		.awaitModalSubmit({
			filter: (interaction) => interaction.customId === "editGiveaway",
			time: 180_000
		})
		.catch(async () => {
			await interaction.followUp({
				content: stripIndents`
						Something went wrong editing the giveaway.
						The time limit is 3 minutes. Try again!
					`,
				ephemeral: true
			});
		});

	if (!modalInteraction) {
		return;
	}

	await modalInteraction.deferUpdate({ fetchReply: true });

	const title = modalInteraction.fields.getTextInputValue("newTitle");

	const rawGiveawayDescription =
		modalInteraction.fields.getTextInputValue("newDescription");

	const description = rawGiveawayDescription
		.split("\n")
		.slice(0, 20)
		.join("\n");

	const winnerQuantity =
		Number(
			modalInteraction.fields.getTextInputValue("newWinnersQuantity")
		) ?? 1;

	new Logger({ prefix: "GIVEAWAY", interaction }).log(
		`Edited giveaway #${id}`
	);

	await giveawayManager.edit({
		where: {
			id
		},
		data: {
			title,
			description,
			winnerQuantity,
			...lastEditBy(interaction.user)
		}
	});

	await toDashboard(modalInteraction, id);
}
