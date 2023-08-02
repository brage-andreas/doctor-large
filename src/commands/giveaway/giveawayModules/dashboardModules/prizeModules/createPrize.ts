import components from "#components";
import { Emojis, Prize } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { ModalCollector } from "#helpers";
import Logger from "#logger";
import { oneLine } from "common-tags";
import { bold, type ButtonInteraction } from "discord.js";
import toPrizeDashboard from "./prizeDashboard.js";

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

		const additionalInfo =
			modalInteraction.fields.getTextInputValue("additionalInfo") || null;

		const quantityString =
			modalInteraction.fields.getTextInputValue("quantity");

		const originalQuantity = parseInt(quantityString) || 1;
		let quantity = originalQuantity;

		if (quantity < 1) {
			quantity = 1;
		} else if (Prize.MaxQuantity < quantity) {
			quantity = Prize.MaxQuantity;
		}

		const { id } = await giveawayManager.createPrize({
			giveawayId,
			name,
			additionalInfo,
			quantity
		});

		new Logger({ label: "GIVEAWAY", interaction }).log(
			`Created prize #${id} in giveaway #${giveawayId}`
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

		toPrizeDashboard(modalInteraction, id, giveawayManager, giveawayId);
	});
}
