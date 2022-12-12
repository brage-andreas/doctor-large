import { type ButtonInteraction } from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import type GiveawayManager from "../../database/giveaway.js";
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
			await interaction.editReply({
				content:
					"Something went wrong. The time limit is 3 minutes. Try again!"
			});
		});

	if (!modalInteraction) {
		return;
	}

	await modalInteraction.deferUpdate({ fetchReply: true });

	const giveawayTitle = modalInteraction.fields.getTextInputValue("newTitle");

	const giveawayDescription =
		modalInteraction.fields.getTextInputValue("newDescription");

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
			lastEditedTimestamp: Date.now().toString(),
			lastEditedUserId: interaction.user.id,
			lastEditedUserTag: interaction.user.tag
		}
	});

	await toDashboard(modalInteraction, giveawayId);
}
