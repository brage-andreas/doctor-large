import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import type GiveawayManager from "../../database/giveaway.js";
import lastEditBy from "../../helpers/lastEdit.js";
import toDashboard from "./mod.dashboard.js";

export default async function toEditGiveaway(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return;
	}

	const editGiveawayModal = giveawayComponents.edit.editOptionsModal(
		giveaway.giveawayId,
		giveaway.giveawayTitle,
		giveaway.giveawayDescription,
		giveaway.numberOfWinners
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

	const giveawayTitle = modalInteraction.fields.getTextInputValue("newTitle");

	const rawGiveawayDescription =
		modalInteraction.fields.getTextInputValue("newDescription");

	const giveawayDescription = rawGiveawayDescription
		.split("\n")
		.slice(0, 20)
		.join("\n");

	const numberOfWinners =
		Number(
			modalInteraction.fields.getTextInputValue("newNumberOfWinners")
		) ?? 1;

	await giveawayManager.edit({
		where: {
			giveawayId
		},
		data: {
			giveawayTitle,
			giveawayDescription,
			numberOfWinners,
			...lastEditBy(interaction.user)
		}
	});

	await toDashboard(modalInteraction, giveawayId);
}
