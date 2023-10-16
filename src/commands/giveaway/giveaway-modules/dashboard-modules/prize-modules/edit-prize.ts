import { type ButtonInteraction, bold } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import toPrizeDashboard from "./prize-dashboard.js";
import type PrizeModule from "#modules/prize.js";
import { Emojis, Prize } from "#constants";
import { ModalCollector } from "#helpers";
import { oneLine } from "common-tags";
import components from "#components";
import Logger from "#logger";

export default async function toEditPrize(
	interaction: ButtonInteraction<"cached">,
	prize: PrizeModule,
	giveawayManager: GiveawayManager,
	giveawayId: number
) {
	const modal = components.modals.editPrize.component({
		oldAdditionalInfo: prize.additionalInfo,
		oldName: prize.name,
		oldQuantity: prize.quantity,
	});

	await interaction.showModal(modal);

	const collector = ModalCollector(interaction, modal);

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const name = modalInteraction.fields.getTextInputValue("name");

		const additionalInfo = modalInteraction.fields.getTextInputValue("additionalInfo") || null;

		const quantityString = modalInteraction.fields.getTextInputValue("quantity");

		const quantityNumber = Number.parseInt(quantityString);
		const originalQuantity = Number.isNaN(quantityNumber) ? 1 : quantityNumber;
		let quantity = originalQuantity;

		if (quantity < 1) {
			quantity = 1;
		} else if (Prize.MaxQuantity < quantity) {
			quantity = Prize.MaxQuantity;
		}

		await giveawayManager.editPrize({
			data: {
				additionalInfo,
				name,
				quantity,
			},
			where: {
				id: prize.id,
			},
		});

		new Logger({ interaction, label: "GIVEAWAY" }).log(`Edited prize #${prize.id} in giveaway #${giveawayId}`);

		if (quantity !== originalQuantity) {
			await interaction.followUp({
				content: oneLine`
					${Emojis.Warn} The quantity must be between 1 and ${Prize.MaxQuantity}.
					Therefore, the quantity was set to
					${bold(quantity.toString())}, instead of ${originalQuantity}.
				`,
				ephemeral: true,
			});
		}

		void toPrizeDashboard(modalInteraction, prize.id, giveawayManager, giveawayId);
	});
}
