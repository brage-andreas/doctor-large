import { Emojis, Giveaway, MAX_REPORT_COMMENT_LENGTH, Prize } from "#constants";
import { modalId } from "#helpers/ModalCollector.js";
import { oneLine } from "common-tags";
import {
	ComponentType,
	ModalBuilder,
	TextInputStyle,
	type APIModalInteractionResponseCallbackData,
	type APITextInputComponent
} from "discord.js";

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
	type: ComponentType.TextInput
});

const modalGiveawayDescription = (): APITextInputComponent => ({
	custom_id: "description",
	label: `Description (max ${Giveaway.MaxDescriptionLines} lines)`,
	max_length: Giveaway.MaxDescriptionLength,
	style: TextInputStyle.Paragraph,
	placeholder: oneLine`
			It's this time of year again!
			This is a thanks for a good year 💝
		`,
	type: ComponentType.TextInput
});

const modalGiveawaywinnerQuantity = (): APITextInputComponent => ({
	custom_id: "winnerQuantity",
	label: "Number of winners",
	max_length: Giveaway.ManWinnerQuantityLength,
	style: TextInputStyle.Short,
	placeholder: "1",
	type: ComponentType.TextInput
});

/**
 * Children: title, description, winnerQuantity
 */
export const createGiveaway = {
	component: () =>
		new ModalBuilder({
			custom_id: modalId(),
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

const modalGiveawayNewTitle = (oldTitle: string): APITextInputComponent => ({
	custom_id: "newTitle",
	label: "New Title",
	max_length: Giveaway.MaxTitleLength,
	style: TextInputStyle.Short,
	required: true,
	value: oldTitle,
	placeholder: oldTitle,
	type: ComponentType.TextInput
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

const modalGiveawayNewDescription = (
	oldDescription: string | null
): APITextInputComponent => {
	const builder: APITextInputComponent = {
		custom_id: "newDescription",
		label: `New description (max ${Giveaway.MaxDescriptionLines} lines)`,
		max_length: Giveaway.MaxDescriptionLength,
		style: TextInputStyle.Paragraph,
		required: true,
		type: ComponentType.TextInput
	};

	if (oldDescription) {
		builder.value = oldDescription;
		builder.placeholder = parsePlaceholder(oldDescription);
	}

	return builder;
};

const modalGiveawayNewWinnerQuantity = (
	oldNumberOfWinners: number
): APITextInputComponent => ({
	custom_id: "newWinnerQuantity",
	label: "New number of winners",
	max_length: Giveaway.ManWinnerQuantityLength,
	style: TextInputStyle.Short,
	required: true,
	value: oldNumberOfWinners.toString(),
	placeholder: oldNumberOfWinners.toString(),
	type: ComponentType.TextInput
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
			custom_id: modalId(),
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

const modalCreatePrizeName = (): APITextInputComponent => ({
	placeholder: "Example prize",
	max_length: Prize.MaxTitleLength,
	min_length: 1,
	custom_id: "name",
	required: true,
	label: "Name",
	style: TextInputStyle.Short,
	type: ComponentType.TextInput
});

const modalCreatePrizeAdditionalInfo = (): APITextInputComponent => ({
	placeholder: "This prize was made with love!",
	max_length: Prize.MaxAdditionalInfoLength,
	min_length: 1,
	custom_id: "additionalInfo",
	required: false,
	label: "Additional info",
	style: TextInputStyle.Short,
	type: ComponentType.TextInput
});

const modalCreatePrizeQuantity = (): APITextInputComponent => ({
	placeholder: "1",
	max_length: Prize.MaxQuantityLength,
	min_length: 1,
	custom_id: "quantity",
	required: true,
	label: "Quantity (max 10)",
	style: TextInputStyle.Short,
	type: ComponentType.TextInput
});

/**
 * Children: title, additionalInfo, quantity
 */
export const createPrize = {
	component: (): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalCreatePrizeName()],
				type: ComponentType.ActionRow
			},
			{
				components: [modalCreatePrizeAdditionalInfo()],
				type: ComponentType.ActionRow
			},
			{
				components: [modalCreatePrizeQuantity()],
				type: ComponentType.ActionRow
			}
		],
		custom_id: modalId(),
		title: "Create prize"
	})
} as const;

// --------------
// - EDIT PRIZE -
// --------------

const modalEditPrizeName = (oldName: string): APITextInputComponent => ({
	placeholder: "Example prize",
	max_length: Prize.MaxTitleLength,
	min_length: 1,
	custom_id: "newName",
	required: true,
	label: "Name",
	value: oldName,
	style: TextInputStyle.Short,
	type: ComponentType.TextInput
});

const modalEditPrizeAdditionalInfo = (
	oldAdditionalInfo: string | null
): APITextInputComponent => ({
	placeholder: "This prize was made with love!",
	max_length: Prize.MaxAdditionalInfoLength,
	min_length: 1,
	custom_id: "newAdditionalInfo",
	required: false,
	label: "Additional info",
	value: oldAdditionalInfo ?? "",
	style: TextInputStyle.Short,
	type: ComponentType.TextInput
});

const modalEditPrizeQuantity = (
	oldQuantity: number
): APITextInputComponent => ({
	placeholder: "1",
	max_length: Prize.MaxQuantityLength,
	min_length: 1,
	custom_id: "newQuantity",
	required: true,
	label: "Quantity",
	value: oldQuantity.toString(),
	style: TextInputStyle.Short,
	type: ComponentType.TextInput
});

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
	}): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalEditPrizeName(oldName)],
				type: ComponentType.ActionRow
			},
			{
				components: [modalEditPrizeAdditionalInfo(oldAdditionalInfo)],
				type: ComponentType.ActionRow
			},
			{
				components: [modalEditPrizeQuantity(oldQuantity)],
				type: ComponentType.ActionRow
			}
		],
		custom_id: modalId(),
		title: "Edit prize"
	})
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
	type: ComponentType.TextInput
});

/**
 * Children: comment
 */
export const createReport = {
	component: (): APIModalInteractionResponseCallbackData => ({
		components: [
			{
				components: [modalCreateReportComment()],
				type: ComponentType.ActionRow
			}
		],
		custom_id: modalId(),
		title: "Create report"
	})
} as const;

// ---
