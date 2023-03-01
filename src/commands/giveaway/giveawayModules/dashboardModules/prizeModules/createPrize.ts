import { Emojis, Prize } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { ModalCollector, modalId } from "#helpers/ModalCollector.js";
import Logger from "#logger";
import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ButtonInteraction
} from "discord.js";
import toPrizeDashboard from "./prizeDashboard.js";

export default async function toCreatePrize(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const nameField = new TextInputBuilder()
		.setPlaceholder("Example prize")
		.setMaxLength(Prize.MaxTitleLength)
		.setMinLength(1)
		.setCustomId("prizeName")
		.setRequired(true)
		.setLabel("Name")
		.setStyle(TextInputStyle.Short);

	const infoField = new TextInputBuilder()
		.setPlaceholder("This prize was made with love!")
		.setMaxLength(Prize.MaxAdditionalInfoLength)
		.setMinLength(1)
		.setCustomId("prizeInfo")
		.setRequired(false)
		.setLabel("Additional info")
		.setStyle(TextInputStyle.Short);

	const quantityField = new TextInputBuilder()
		.setPlaceholder("1")
		.setMaxLength(Prize.MaxQuantityLength)
		.setMinLength(1)
		.setCustomId("prizeQuantity")
		.setRequired(true)
		.setLabel("Quantity (max 10)")
		.setStyle(TextInputStyle.Short);

	const row = (component: TextInputBuilder) =>
		new ActionRowBuilder<TextInputBuilder>().setComponents(component);

	const modal = new ModalBuilder()
		.setComponents(row(nameField), row(infoField), row(quantityField))
		.setCustomId(modalId())
		.setTitle("Create prize");

	await interaction.showModal(modal);

	const collector = ModalCollector(interaction, modal);

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const name = modalInteraction.fields.getTextInputValue("prizeName");

		const additionalInfo =
			modalInteraction.fields.getTextInputValue("prizeInfo") || null;

		const quantityString =
			modalInteraction.fields.getTextInputValue("prizeQuantity");

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

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Created prize #${id} in giveaway #${giveawayId}`
		);

		if (quantity !== originalQuantity) {
			await interaction.followUp({
				ephemeral: true,
				content: oneLine`
					${Emojis.Warn} The quantity must be between 1 and ${Prize.MaxQuantity}.
					Therefore, the quantity was set to **${quantity}**, instead of ${originalQuantity}.
				`
			});
		}

		toPrizeDashboard(modalInteraction, id, giveawayManager, giveawayId);
	});
}
