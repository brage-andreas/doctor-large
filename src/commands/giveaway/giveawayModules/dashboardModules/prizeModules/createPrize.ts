import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ButtonInteraction
} from "discord.js";
import { PRIZE } from "../../../../../constants.js";
import type GiveawayManager from "../../../../../database/giveaway.js";
import {
	ModalCollector,
	modalId
} from "../../../../../helpers/ModalCollector.js";
import Logger from "../../../../../logger/logger.js";
import toPrizeDashboard from "./prizeDashboard.js";

export default async function toCreatePrize(
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

	const collector = ModalCollector(interaction, modal);

	collector.on("collect", async (modalInteraction) => {
		await modalInteraction.deferUpdate();

		const name = modalInteraction.fields.getTextInputValue("prizeName");

		const additionalInfo =
			modalInteraction.fields.getTextInputValue("prizeInfo");

		const quantityString =
			modalInteraction.fields.getTextInputValue("prizeQuantity");

		const maxQuantity = Number("9".repeat(PRIZE.MAX_QUANTITY_LEN));
		let quantity = parseInt(quantityString) || 1;

		if (quantity < 1) {
			quantity = 1;
		} else if (maxQuantity < quantity) {
			quantity = maxQuantity;
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

		toPrizeDashboard(modalInteraction, id, giveawayManager, giveawayId);
	});
}
