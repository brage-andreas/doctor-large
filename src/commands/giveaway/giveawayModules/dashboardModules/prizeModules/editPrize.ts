import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ButtonInteraction
} from "discord.js";
import { PRIZE } from "../../../../../constants.js";
import type GiveawayManager from "../../../../../database/giveaway.js";
import { modalId } from "../../../../../helpers/ModalCollector.js";

export default async function toEditPrize(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const nameField = new TextInputBuilder()
		.setPlaceholder("Example prize")
		.setMaxLength(PRIZE.MAX_TITLE_LEN)
		.setMinLength(1)
		.setCustomId("prizeName")
		.setRequired(true)
		.setLabel("Name")
		.setStyle(TextInputStyle.Short);

	const infoField = new TextInputBuilder()
		.setPlaceholder("This prize was made with love!")
		.setMaxLength(PRIZE.MAX_ADDITIONAL_INFO_LEN)
		.setMinLength(1)
		.setCustomId("prizeInfo")
		.setRequired(true)
		.setLabel("Additional info")
		.setStyle(TextInputStyle.Short);

	const quantityField = new TextInputBuilder()
		.setPlaceholder("1")
		.setMaxLength(PRIZE.MAX_QUANTITY_LEN)
		.setMinLength(1)
		.setCustomId("prizeQuantity")
		.setRequired(true)
		.setLabel("Quantity")
		.setStyle(TextInputStyle.Short);

	const row = (component: TextInputBuilder) =>
		new ActionRowBuilder<TextInputBuilder>().setComponents(component);

	const modal = new ModalBuilder()
		.setComponents(row(nameField), row(infoField), row(quantityField))
		.setCustomId(modalId())
		.setTitle("Create prize");

	await interaction.showModal(modal);

	giveawayId;
	giveawayManager;
}
