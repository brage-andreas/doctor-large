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
import type Prize from "../../../../../modules/Prize.js";
import toPrizeDashboard from "./prizeDashboard.js";

export default async function toEditPrize(
	interaction: ButtonInteraction<"cached">,
	prize: Prize,
	giveawayManager: GiveawayManager,
	giveawayId: number
) {
	const nameField = new TextInputBuilder()
		.setPlaceholder("Example prize")
		.setMaxLength(PRIZE.MAX_TITLE_LEN)
		.setMinLength(1)
		.setCustomId("prizeName")
		.setRequired(true)
		.setLabel("Name")
		.setValue(prize.name)
		.setStyle(TextInputStyle.Short);

	const infoField = new TextInputBuilder()
		.setPlaceholder("This prize was made with love!")
		.setMaxLength(PRIZE.MAX_ADDITIONAL_INFO_LEN)
		.setMinLength(1)
		.setCustomId("prizeInfo")
		.setRequired(false)
		.setLabel("Additional info")
		.setStyle(TextInputStyle.Short);

	if (prize.additionalInfo) {
		infoField.setValue(prize.additionalInfo);
	}

	const quantityField = new TextInputBuilder()
		.setPlaceholder("1")
		.setMaxLength(PRIZE.MAX_QUANTITY_LEN)
		.setMinLength(1)
		.setCustomId("prizeQuantity")
		.setRequired(true)
		.setLabel("Quantity")
		.setValue(prize.quantity.toString())
		.setStyle(TextInputStyle.Short);

	const row = (component: TextInputBuilder) =>
		new ActionRowBuilder<TextInputBuilder>().setComponents(component);

	const modal = new ModalBuilder()
		.setComponents(row(nameField), row(infoField), row(quantityField))
		.setCustomId(modalId())
		.setTitle("Edit prize");

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

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Edited prize #${prize.id} in giveaway #${giveawayId}`
		);

		toPrizeDashboard(
			modalInteraction,
			prize.id,
			giveawayManager,
			giveawayId
		);
	});
}
