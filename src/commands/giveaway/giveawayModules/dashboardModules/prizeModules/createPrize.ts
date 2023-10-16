import { type ButtonInteraction, bold } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import toPrizeDashboard from "./prizeDashboard.js";
import { Emojis, Prize } from "#constants";
import { ModalCollector } from "#helpers";
import { oneLine } from "common-tags";
import components from "#components";
import Logger from "#logger";

export default async function toCreatePrize(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const modal = components.modals.createPrize.component();

	await interaction.showModal(modal);

	const collector = ModalCollector(interaction, modal);

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const name = modalInteraction.fields.getTextInputValue("name");

		const additionalInfo = modalInteraction.fields.getTextInputValue("additionalInfo") || null;

		const quantityString = modalInteraction.fields.getTextInputValue("quantity");

		const originalQuantity = Number.parseInt(quantityString) || 1;
		let quantity = originalQuantity;

		if (quantity < 1) {
			quantity = 1;
		} else if (Prize.MaxQuantity < quantity) {
			quantity = Prize.MaxQuantity;
		}

		const { id } = await giveawayManager.createPrize({
			additionalInfo,
			giveawayId,
			name,
			quantity,
		});

		new Logger({ interaction, label: "GIVEAWAY" }).log(`Created prize #${id} in giveaway #${giveawayId}`);

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

		void toPrizeDashboard(modalInteraction, id, giveawayManager, giveawayId);
	});
}
