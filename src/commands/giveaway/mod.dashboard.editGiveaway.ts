import { type ButtonInteraction } from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import type GiveawayManager from "../../database/giveaway.js";
import toDashboard from "./mod.dashboard.js";

export default async function (
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

	const modalResponse = await interaction
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

	if (!modalResponse) {
		return;
	}

	await modalResponse.deferUpdate();

	const giveawayTitle = modalResponse.fields.getTextInputValue("new-title");

	const giveawayDescription =
		modalResponse.fields.getTextInputValue("new-description");

	const numberOfWinners =
		Number(
			modalResponse.fields.getTextInputValue("new-number-of-winners")
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

	await toDashboard(interaction, giveawayManager, giveawayId);
}
