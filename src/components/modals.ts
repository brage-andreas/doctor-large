// -------------------
// - CREATE GIVEAWAY -
// -------------------

import { Emojis, Giveaway, MAX_REPORT_COMMENT_LENGTH, Prize } from "#constants";
import { modalId } from "#helpers/ModalCollector.js";
import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";

const modalGiveawayTitle = () =>
	new TextInputBuilder({
		customId: "title",
		label: "Title",
		maxLength: Giveaway.MaxTitleLength,
		placeholder: "Summer Giveaway 2044",
		required: true,
		style: TextInputStyle.Short
	});

const modalGiveawayDescription = () =>
	new TextInputBuilder({
		customId: "description",
		label: `Description (max ${Giveaway.MaxDescriptionLines} lines)`,
		maxLength: Giveaway.MaxDescriptionLength,
		style: TextInputStyle.Paragraph,
		placeholder: oneLine`
			It's this time of year again!
			This is a thanks for a good year 💝
		`
	});

const modalGiveawaywinnerQuantity = () =>
	new TextInputBuilder({
		customId: "winnerQuantity",
		label: "Number of winners",
		maxLength: Giveaway.ManWinnerQuantityLength,
		style: TextInputStyle.Short,
		placeholder: "1"
	});

/**
 * Children: title, description, winnerQuantity
 */
export const createGiveaway = {
	component: () =>
		new ModalBuilder({
			customId: modalId(),
			title: "Create a giveaway",
			components: [
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayTitle()]
				},
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayDescription()]
				},
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawaywinnerQuantity()]
				}
			]
		})
} as const;

// -----------------
// - EDIT GIVEAWAY -
// -----------------

const modalGiveawayNewTitle = (oldTitle: string) =>
	new TextInputBuilder({
		customId: "newTitle",
		label: "New Title",
		maxLength: Giveaway.MaxTitleLength,
		style: TextInputStyle.Short,
		required: true,
		value: oldTitle,
		placeholder: oldTitle
	});

const EMPTY_DESCRIPTION = `${Emojis.Sleep} Whoa so empty — there is no description`;
const parsePlaceholder = (string: string | null) => {
	if (!string) {
		return EMPTY_DESCRIPTION;
	}

	if (string.length > 100) {
		return `${string.slice(0, 97)}...`;
	}

	return string;
};

const modalGiveawayNewDescription = (oldDescription: string | null) => {
	const builder = new TextInputBuilder({
		customId: "newDescription",
		label: `New description (max ${Giveaway.MaxDescriptionLines} lines)`,
		maxLength: Giveaway.MaxDescriptionLength,
		style: TextInputStyle.Paragraph,
		required: true
	});

	if (oldDescription) {
		builder.setValue(oldDescription);
		builder.setPlaceholder(parsePlaceholder(oldDescription));
	}

	return builder;
};

const modalGiveawayNewWinnerQuantity = (oldNumberOfWinners: number) =>
	new TextInputBuilder({
		customId: "newWinnerQuantity",
		label: "New number of winners",
		maxLength: Giveaway.ManWinnerQuantityLength,
		style: TextInputStyle.Short,
		required: true,
		value: oldNumberOfWinners.toString(),
		placeholder: oldNumberOfWinners.toString()
	});

/**
 * Children: newTitle, newDescription, newWinnerQuantity
 */
export const editGiveaway = {
	component: ({
		guildRelativeId,
		oldTitle,
		oldDescription,
		oldWinnerQuantity
	}: {
		guildRelativeId: number;
		oldTitle: string;
		oldDescription: string | null;
		oldWinnerQuantity: number;
	}) =>
		new ModalBuilder({
			customId: modalId(),
			title: `Edit giveaway #${guildRelativeId}`,
			components: [
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayNewTitle(oldTitle)]
				},
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayNewDescription(oldDescription)]
				},
				{
					type: ComponentType.ActionRow,
					components: [
						modalGiveawayNewWinnerQuantity(oldWinnerQuantity)
					]
				}
			]
		})
} as const;

// ----------------
// - CREATE PRIZE -
// ----------------

const modalCreatePrizeName = () =>
	new TextInputBuilder()
		.setPlaceholder("Example prize")
		.setMaxLength(Prize.MaxTitleLength)
		.setMinLength(1)
		.setCustomId("name")
		.setRequired(true)
		.setLabel("Name")
		.setStyle(TextInputStyle.Short);

const modalCreatePrizeAdditionalInfo = () =>
	new TextInputBuilder()
		.setPlaceholder("This prize was made with love!")
		.setMaxLength(Prize.MaxAdditionalInfoLength)
		.setMinLength(1)
		.setCustomId("additionalInfo")
		.setRequired(false)
		.setLabel("Additional info")
		.setStyle(TextInputStyle.Short);

const modalCreatePrizeQuantity = () =>
	new TextInputBuilder()
		.setPlaceholder("1")
		.setMaxLength(Prize.MaxQuantityLength)
		.setMinLength(1)
		.setCustomId("quantity")
		.setRequired(true)
		.setLabel("Quantity (max 10)")
		.setStyle(TextInputStyle.Short);

/**
 * Children: title, additionalInfo, quantity
 */
export const createPrize = {
	component: () =>
		new ModalBuilder()
			.setComponents(
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalCreatePrizeName()
				),
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalCreatePrizeAdditionalInfo()
				),
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalCreatePrizeQuantity()
				)
			)
			.setCustomId(modalId())
			.setTitle("Create prize")
} as const;

// --------------
// - EDIT PRIZE -
// --------------

const modalEditPrizeName = (oldName: string) =>
	new TextInputBuilder()
		.setPlaceholder("Example prize")
		.setMaxLength(Prize.MaxTitleLength)
		.setMinLength(1)
		.setCustomId("newName")
		.setRequired(true)
		.setLabel("Name")
		.setValue(oldName)
		.setStyle(TextInputStyle.Short);

const modalEditPrizeAdditionalInfo = (oldAdditionalInfo: string | null) =>
	new TextInputBuilder()
		.setPlaceholder("This prize was made with love!")
		.setMaxLength(Prize.MaxAdditionalInfoLength)
		.setMinLength(1)
		.setCustomId("newAdditionalInfo")
		.setRequired(false)
		.setLabel("Additional info")
		.setValue(oldAdditionalInfo ?? "")
		.setStyle(TextInputStyle.Short);

const modalEditPrizeQuantity = (oldQuantity: number) =>
	new TextInputBuilder()
		.setPlaceholder("1")
		.setMaxLength(Prize.MaxQuantityLength)
		.setMinLength(1)
		.setCustomId("newQuantity")
		.setRequired(true)
		.setLabel("Quantity")
		.setValue(oldQuantity.toString())
		.setStyle(TextInputStyle.Short);

/**
 * Children: newName, newAdditionalInfo, newQuantity
 */
export const editPrize = {
	component: ({
		oldName,
		oldAdditionalInfo,
		oldQuantity
	}: {
		oldName: string;
		oldAdditionalInfo: string | null;
		oldQuantity: number;
	}) =>
		new ModalBuilder()
			.setComponents(
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalEditPrizeName(oldName)
				),
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalEditPrizeAdditionalInfo(oldAdditionalInfo)
				),
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalEditPrizeQuantity(oldQuantity)
				)
			)
			.setCustomId(modalId())
			.setTitle("Edit prize")
} as const;

// -----------------
// - CREATE REPORT -
// -----------------

const modalCreateReportComment = () =>
	new TextInputBuilder()
		.setCustomId("comment")
		.setLabel("Report comment for the moderators")
		.setMaxLength(MAX_REPORT_COMMENT_LENGTH)
		.setMinLength(1)
		.setPlaceholder("Help them understand the context of this report.")
		.setRequired(true)
		.setStyle(TextInputStyle.Short);

/**
 * Children: comment
 */
export const createReport = {
	component: () =>
		new ModalBuilder()
			.setComponents(
				new ActionRowBuilder<TextInputBuilder>().setComponents(
					modalCreateReportComment()
				)
			)
			.setCustomId(modalId())
			.setTitle("Create report")
} as const;

// ---
