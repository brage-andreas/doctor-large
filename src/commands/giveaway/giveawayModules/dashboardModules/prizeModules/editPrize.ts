import components from "#components";
import { Emojis, Prize } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { ModalCollector } from "#helpers/ModalCollector.js";
import Logger from "#logger";
import type PrizeModule from "#modules/Prize.js";
import { oneLine } from "common-tags";
import { bold, type ButtonInteraction } from "discord.js";
import toPrizeDashboard from "./prizeDashboard.js";

export default async function toEditPrize(
	interaction: ButtonInteraction<"cached">,
	prize: PrizeModule,
	giveawayManager: GiveawayManager,
	giveawayId: number
) {
	const modal = components.modals.editPrize.component({
		oldName: prize.name,
		oldAdditionalInfo: prize.additionalInfo,
		oldQuantity: prize.quantity
	});

	await interaction.showModal(modal);

	const collector = ModalCollector(interaction, modal);

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const name = modalInteraction.fields.getTextInputValue("name");

		const additionalInfo =
			modalInteraction.fields.getTextInputValue("additionalInfo") || null;

		const quantityString =
			modalInteraction.fields.getTextInputValue("quantity");

		const quantityNumber = parseInt(quantityString);
		const originalQuantity = isNaN(quantityNumber) ? 1 : quantityNumber;
		let quantity = originalQuantity;

		if (quantity < 1) {
			quantity = 1;
		} else if (Prize.MaxQuantity < quantity) {
			quantity = Prize.MaxQuantity;
		}

		await giveawayManager.editPrize({
			where: {
				id: prize.id
			},
			data: {
				name,
				additionalInfo,
				quantity
			}
		});

		new Logger({ label: "GIVEAWAY", interaction }).log(
			`Edited prize #${prize.id} in giveaway #${giveawayId}`
		);

		if (quantity !== originalQuantity) {
			await interaction.followUp({
				ephemeral: true,
				content: oneLine`
					${Emojis.Warn} The quantity must be between 1 and ${Prize.MaxQuantity}.
					Therefore, the quantity was set to
					${bold(quantity.toString())}, instead of ${originalQuantity}.
				`
			});
		}

		toPrizeDashboard(
			modalInteraction,
			prize.id,
			giveawayManager,
			giveawayId
		);
	});
}
