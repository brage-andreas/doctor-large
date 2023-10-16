import {
	type APIModalInteractionResponseCallbackData,
	type APITextInputComponent,
	ComponentType,
	TextInputStyle,
} from "discord.js";
import { Emojis, Giveaway, MAX_REPORT_COMMENT_LENGTH, Prize } from "#constants";
import { oneLine } from "common-tags";
import { modalId } from "#helpers";

// -------------------
// - CREATE GIVEAWAY -
// -------------------

const modalGiveawayTitle = (): APITextInputComponent => ({
	custom_id: "title",
	label: "Title",
	max_length: Giveaway.MaxTitleLength,
	placeholder: "Summer Giveaway 2044",
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
});

const modalGiveawayDescription = (): APITextInputComponent => ({
	custom_id: "description",
	label: `Description (max ${Giveaway.MaxDescriptionLines} lines)`,
	max_length: Giveaway.MaxDescriptionLength,
	placeholder: oneLine`
			It's this time of year again!
			This is a thanks for a good year 💝
		`,
	style: TextInputStyle.Paragraph,
	type: ComponentType.TextInput,
});

const modalGiveawaywinnerQuantity = (): APITextInputComponent => ({
	custom_id: "winnerQuantity",
	label: "Number of winners",
	max_length: Giveaway.ManWinnerQuantityLength,
	placeholder: "1",
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
});

/**
 * Children: title, description, winnerQuantity
 */
export const createGiveaway = {
	component: (): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalGiveawayTitle()],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalGiveawayDescription()],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalGiveawaywinnerQuantity()],
				type: ComponentType.ActionRow,
			},
		],
		custom_id: modalId(),
		title: "Create a giveaway",
	}),
} as const;

// -----------------
// - EDIT GIVEAWAY -
// -----------------

const modalGiveawayNewTitle = (oldTitle: string): APITextInputComponent => ({
	custom_id: "newTitle",
	label: "New Title",
	max_length: Giveaway.MaxTitleLength,
	placeholder: oldTitle,
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
	value: oldTitle,
});

const EMPTY_DESCRIPTION = `${Emojis.Sleep} Whoa so empty — there is no description`;
const parsePlaceholder = (string: null | string) => {
	if (!string) {
		return EMPTY_DESCRIPTION;
	}

	if (string.length > 100) {
		return `${string.slice(0, 97)}...`;
	}

	return string;
};

const modalGiveawayNewDescription = (oldDescription: null | string): APITextInputComponent => {
	const builder: APITextInputComponent = {
		custom_id: "newDescription",
		label: `New description (max ${Giveaway.MaxDescriptionLines} lines)`,
		max_length: Giveaway.MaxDescriptionLength,
		required: true,
		style: TextInputStyle.Paragraph,
		type: ComponentType.TextInput,
	};

	if (oldDescription) {
		builder.value = oldDescription;
		builder.placeholder = parsePlaceholder(oldDescription);
	}

	return builder;
};

const modalGiveawayNewWinnerQuantity = (oldNumberOfWinners: number): APITextInputComponent => ({
	custom_id: "newWinnerQuantity",
	label: "New number of winners",
	max_length: Giveaway.ManWinnerQuantityLength,
	placeholder: oldNumberOfWinners.toString(),
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
	value: oldNumberOfWinners.toString(),
});

/**
 * Children: newTitle, newDescription, newWinnerQuantity
 */
export const editGiveaway = {
	component: ({
		guildRelativeId,
		oldDescription,
		oldTitle,
		oldWinnerQuantity,
	}: {
		guildRelativeId: number;
		oldDescription: null | string;
		oldTitle: string;
		oldWinnerQuantity: number;
	}): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalGiveawayNewTitle(oldTitle)],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalGiveawayNewDescription(oldDescription)],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalGiveawayNewWinnerQuantity(oldWinnerQuantity)],
				type: ComponentType.ActionRow,
			},
		],
		custom_id: modalId(),
		title: `Edit giveaway #${guildRelativeId}`,
	}),
} as const;

// ----------------
// - CREATE PRIZE -
// ----------------

const modalCreatePrizeName = (): APITextInputComponent => ({
	custom_id: "name",
	label: "Name",
	max_length: Prize.MaxTitleLength,
	min_length: 1,
	placeholder: "Example prize",
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
});

const modalCreatePrizeAdditionalInfo = (): APITextInputComponent => ({
	custom_id: "additionalInfo",
	label: "Additional info",
	max_length: Prize.MaxAdditionalInfoLength,
	min_length: 1,
	placeholder: "This prize was made with love!",
	required: false,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
});

const modalCreatePrizeQuantity = (): APITextInputComponent => ({
	custom_id: "quantity",
	label: "Quantity (max 10)",
	max_length: Prize.MaxQuantityLength,
	min_length: 1,
	placeholder: "1",
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
});

/**
 * Children: title, additionalInfo, quantity
 */
export const createPrize = {
	component: (): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalCreatePrizeName()],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalCreatePrizeAdditionalInfo()],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalCreatePrizeQuantity()],
				type: ComponentType.ActionRow,
			},
		],
		custom_id: modalId(),
		title: "Create prize",
	}),
} as const;

// --------------
// - EDIT PRIZE -
// --------------

const modalEditPrizeName = (oldName: string): APITextInputComponent => ({
	custom_id: "newName",
	label: "Name",
	max_length: Prize.MaxTitleLength,
	min_length: 1,
	placeholder: "Example prize",
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
	value: oldName,
});

const modalEditPrizeAdditionalInfo = (oldAdditionalInfo: null | string): APITextInputComponent => ({
	custom_id: "newAdditionalInfo",
	label: "Additional info",
	max_length: Prize.MaxAdditionalInfoLength,
	min_length: 1,
	placeholder: "This prize was made with love!",
	required: false,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
	value: oldAdditionalInfo ?? "",
});

const modalEditPrizeQuantity = (oldQuantity: number): APITextInputComponent => ({
	custom_id: "newQuantity",
	label: "Quantity",
	max_length: Prize.MaxQuantityLength,
	min_length: 1,
	placeholder: "1",
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
	value: oldQuantity.toString(),
});

/**
 * Children: newName, newAdditionalInfo, newQuantity
 */
export const editPrize = {
	component: ({
		oldAdditionalInfo,
		oldName,
		oldQuantity,
	}: {
		oldAdditionalInfo: null | string;
		oldName: string;
		oldQuantity: number;
	}): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalEditPrizeName(oldName)],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalEditPrizeAdditionalInfo(oldAdditionalInfo)],
				type: ComponentType.ActionRow,
			},
			{
				components: [modalEditPrizeQuantity(oldQuantity)],
				type: ComponentType.ActionRow,
			},
		],
		custom_id: modalId(),
		title: "Edit prize",
	}),
} as const;

// -----------------
// - CREATE REPORT -
// -----------------

const modalCreateReportComment = (): APITextInputComponent => ({
	custom_id: "comment",
	label: "Report comment for the moderators",
	max_length: MAX_REPORT_COMMENT_LENGTH,
	min_length: 1,
	placeholder: "Help them understand the context of this report.",
	required: true,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput,
});

/**
 * Children: comment
 */
export const createReport = {
	component: (): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalCreateReportComment()],
				type: ComponentType.ActionRow,
			},
		],
		custom_id: modalId(),
		title: "Create report",
	}),
} as const;

// ---
