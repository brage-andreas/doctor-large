import { oneLine } from "common-tags";
import {
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	ModalBuilder,
	RoleSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import { EMOJIS, GIVEAWAY } from "../constants.js";
import { modalId } from "../helpers/ModalCollector.js";

const modalGiveawayTitle = () =>
	new TextInputBuilder({
		customId: "title",
		label: "Title",
		maxLength: GIVEAWAY.MAX_TITLE_LEN,
		placeholder: "Summer Giveaway 2044",
		required: true,
		style: TextInputStyle.Short
	});

const modalGiveawayDescription = () =>
	new TextInputBuilder({
		customId: "description",
		label: `Description (max ${GIVEAWAY.MAX_DESCRIPTION_LINES} lines)`,
		maxLength: GIVEAWAY.MAX_DESCRIPTION_LEN,
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
		maxLength: GIVEAWAY.MAX_WINNER_QUANTITY_LEN,
		style: TextInputStyle.Short,
		placeholder: "1"
	});

/**
 * Children: title, description, winnerQuantity
 */
const createOptionsModal = () =>
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
	});

const modalGiveawayNewTitle = (oldTitle: string) =>
	new TextInputBuilder({
		customId: "newTitle",
		label: "New Title",
		maxLength: GIVEAWAY.MAX_TITLE_LEN,
		style: TextInputStyle.Short,
		required: true,
		value: oldTitle,
		placeholder: oldTitle
	});

const emptyString = `${EMOJIS.SLEEP} Whoa so empty — there is no description`;

const modalGiveawayNewDescription = (oldDescription: string | null) => {
	const builder = new TextInputBuilder({
		customId: "newDescription",
		label: `New description (max ${GIVEAWAY.MAX_DESCRIPTION_LINES} lines)`,
		maxLength: GIVEAWAY.MAX_DESCRIPTION_LEN,
		style: TextInputStyle.Paragraph,
		required: true
	});

	if (oldDescription) {
		builder.setValue(oldDescription);
		builder.setPlaceholder(oldDescription ?? emptyString);
	}

	return builder;
};

const modalGiveawayNewWinnerQuantity = (oldNumberOfWinners: number) =>
	new TextInputBuilder({
		customId: "newWinnerQuantity",
		label: "New number of winners",
		maxLength: GIVEAWAY.MAX_WINNER_QUANTITY_LEN,
		style: TextInputStyle.Short,
		required: true,
		value: oldNumberOfWinners.toString(),
		placeholder: oldNumberOfWinners.toString()
	});

/**
 * Children: newTitle, newDescription, newWinnerQuantity
 */
const editOptionsModal = (
	guildRelativeId: number,
	oldDescription: string | null,
	oldTitle: string,
	oldWinnerQuantity: number
) =>
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
				components: [modalGiveawayNewWinnerQuantity(oldWinnerQuantity)]
			}
		]
	});

const publishGiveawayButton = () =>
	new ButtonBuilder({
		customId: "publishGiveaway",
		style: ButtonStyle.Success,
		label: "Publish"
	});

const publishingOptionsButton = () =>
	new ButtonBuilder({
		customId: "publishingOptions",
		style: ButtonStyle.Success,
		label: "Publishing Options"
	});

const lockGiveawayEntriesButton = () =>
	new ButtonBuilder({
		customId: "lockEntries",
		style: ButtonStyle.Secondary,
		emoji: EMOJIS.LOCK,
		label: "Lock entries"
	});

const unlockGiveawayEntriesButton = () =>
	new ButtonBuilder({
		customId: "unlockEntries",
		emoji: EMOJIS.UNLOCK,
		label: "Unlock entries",
		style: ButtonStyle.Secondary
	});

const setEndDateButton = () =>
	new ButtonBuilder({
		customId: "setEndDate",
		style: ButtonStyle.Secondary,
		label: "Set end date"
	});

const setRequiredRolesButton = () =>
	new ButtonBuilder({
		customId: "setRequiredRoles",
		style: ButtonStyle.Secondary,
		label: "Set required roles"
	});

const clearRequiredRolesButton = () =>
	new ButtonBuilder({
		customId: "clearRequiredRoles",
		style: ButtonStyle.Secondary,
		label: "Clear required roles"
	});

const setPingRolesToAtEveryoneButton = () =>
	new ButtonBuilder({
		customId: "setPingRolesToAtEveryone",
		style: ButtonStyle.Primary,
		label: "Set to @everyone"
	});

const setPingRolesButton = () =>
	new ButtonBuilder({
		customId: "setPingRoles",
		style: ButtonStyle.Secondary,
		label: "Set ping roles"
	});

const clearPingRolesButton = () =>
	new ButtonBuilder({
		customId: "clearPingRoles",
		style: ButtonStyle.Secondary,
		label: "Clear ping roles"
	});

const editButton = () =>
	new ButtonBuilder({
		customId: "edit",
		style: ButtonStyle.Primary,
		emoji: EMOJIS.EDIT,
		label: "Edit"
	});

const manageGiveawayPrizesButton = () =>
	new ButtonBuilder({
		customId: "managePrizes",
		style: ButtonStyle.Success,
		label: "Manage prizes"
	});

const endGiveawayButton = () =>
	new ButtonBuilder({
		customId: "endGiveaway",
		style: ButtonStyle.Primary,
		label: "End giveaway"
	});

const resetDataButton = () =>
	new ButtonBuilder({
		customId: "resetData",
		style: ButtonStyle.Primary,
		label: "Reset data"
	});

const deleteGiveawayButton = () =>
	new ButtonBuilder({
		customId: "deleteGiveaway",
		style: ButtonStyle.Danger,
		label: "Delete giveaway"
	});

const lastChannelButton = () =>
	new ButtonBuilder({
		customId: "lastChannel",
		label: "Use the previous channel",
		style: ButtonStyle.Primary
	});

const editCurrentMessageButton = () =>
	new ButtonBuilder({
		customId: "editCurrent",
		label: "Edit current message",
		style: ButtonStyle.Success
	});

const recallCurrentMessageButton = () =>
	new ButtonBuilder({
		customId: "recallCurrent",
		label: "Recall current message",
		style: ButtonStyle.Danger
	});

const enterGiveawayButton = (id: number) =>
	new ButtonBuilder({
		customId: `enter-,iveaway-${id}`,
		label: "Enter",
		style: ButtonStyle.Success,
		emoji: EMOJIS.ENTER_GIVEAWAY_EMOJI
	});

const reactivateGiveawayButton = () =>
	new ButtonBuilder({
		customId: "reactivateGiveaway",
		label: "Reactivate giveaway",
		style: ButtonStyle.Secondary
	});

const publishWinnersButton = () =>
	new ButtonBuilder({
		customId: "publishWinners",
		label: "Publish winners",
		style: ButtonStyle.Success
	});

const republishWinnersButton = () =>
	new ButtonBuilder({
		customId: "republishWinners",
		label: "Republish winners",
		style: ButtonStyle.Success
	});

const unpublishWinnersButton = () =>
	new ButtonBuilder({
		customId: "unpublishWinners",
		label: "Unpublish winners",
		style: ButtonStyle.Secondary
	});

const showAllWinnersButton = () =>
	new ButtonBuilder({
		customId: "showAllWinners",
		label: "Show all winners",
		style: ButtonStyle.Primary
	});

const rerollWinnersButton = () =>
	new ButtonBuilder({
		customId: "rerollWinners",
		label: "Reroll unclaimed",
		style: ButtonStyle.Secondary
	});

const rerollAllWinnersButton = () =>
	new ButtonBuilder({
		customId: "rerollAllWinners",
		label: "Reroll all",
		style: ButtonStyle.Danger
	});

const deleteUnclaimedWinnersButton = () =>
	new ButtonBuilder({
		customId: "deleteUnclaimedWinners",
		label: "Delete unclaimed",
		style: ButtonStyle.Secondary
	});

const deleteAllWinnersButton = () =>
	new ButtonBuilder({
		customId: "deleteAllWinners",
		label: "Delete all",
		style: ButtonStyle.Danger
	});

const enableButton = () =>
	new ButtonBuilder({
		customId: "enable",
		label: "Enable",
		style: ButtonStyle.Success
	});

const disableButton = () =>
	new ButtonBuilder({
		label: "Disable",
		customId: "disable",
		style: ButtonStyle.Danger
	});

const roleSelectMenu = (min = 1, max = 10) =>
	new RoleSelectMenuBuilder({
		customId: "roleSelect",
		minValues: min,
		maxValues: max
	});

const clearRolesButton = () =>
	new ButtonBuilder({
		customId: "clearRoles",
		style: ButtonStyle.Secondary,
		label: "Clear roles"
	});

const backButton = () =>
	new ButtonBuilder({
		customId: "back",
		label: "Back",
		style: ButtonStyle.Secondary
	});

const acceptAllPrizesButton = () =>
	new ButtonBuilder({
		customId: "acceptAllPrizes",
		emoji: EMOJIS.TADA,
		label: "Accept all prizes",
		style: ButtonStyle.Success
	});

const viewAllEnteredButton = () =>
	new ButtonBuilder({
		customId: "viewAllEntered",
		label: "View entered",
		style: ButtonStyle.Secondary
	});

const viewAllPrizesButton = () =>
	new ButtonBuilder({
		customId: "viewAllPrizes",
		label: "View prizes",
		style: ButtonStyle.Secondary
	});

const viewAllHostedButton = () =>
	new ButtonBuilder({
		customId: "viewAllHosted",
		label: "View hosted",
		style: ButtonStyle.Secondary
	});

const selects = {
	roleSelect: roleSelectMenu
};

const modals = {
	/**
	 * Children: title, description, numberOfWinners
	 */
	createGiveaway: createOptionsModal,

	/**
	 * Children: newTitle, newDescription, newWinnerQuantity
	 */
	editGiveaway: editOptionsModal
} as const;

const buttons = {
	setPingRolesToAtEveryone: setPingRolesToAtEveryoneButton,
	deleteUnclaimedWinners: deleteUnclaimedWinnersButton,
	recallCurrentMessage: recallCurrentMessageButton,
	clearRequiredRoles: clearRequiredRolesButton,
	editCurrentMessage: editCurrentMessageButton,
	reactivateGiveaway: reactivateGiveawayButton,
	publishingOptions: publishingOptionsButton,
	deleteAllWinners: deleteAllWinnersButton,
	republishWinners: republishWinnersButton,
	rerollAllWinners: rerollAllWinnersButton,
	setRequiredRoles: setRequiredRolesButton,
	unpublishWinners: unpublishWinnersButton,
	acceptAllPrizes: acceptAllPrizesButton,
	publishGiveaway: publishGiveawayButton,
	clearPingRoles: clearPingRolesButton,
	deleteGiveaway: deleteGiveawayButton,
	publishWinners: publishWinnersButton,
	showAllWinners: showAllWinnersButton,
	viewAllEntered: viewAllEnteredButton,
	enterGiveaway: enterGiveawayButton,
	rerollWinners: rerollWinnersButton,
	unlockEntries: unlockGiveawayEntriesButton,
	viewAllHosted: viewAllHostedButton,
	viewAllPrizes: viewAllPrizesButton,
	managePrizes: manageGiveawayPrizesButton,
	setPingRoles: setPingRolesButton,
	endGiveaway: endGiveawayButton,
	lastChannel: lastChannelButton,
	lockEntries: lockGiveawayEntriesButton,
	clearRoles: clearRolesButton,
	setEndDate: setEndDateButton,
	resetData: resetDataButton,
	disable: disableButton,
	enable: enableButton,
	back: backButton,
	edit: editButton
};

const components = {
	buttons,
	modals,
	selects
};

export default components;
