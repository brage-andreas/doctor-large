import { oneLine } from "common-tags";
import {
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
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
const createOptionsModal = {
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
const editOptionsModal = {
	component: (
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
					components: [
						modalGiveawayNewWinnerQuantity(oldWinnerQuantity)
					]
				}
			]
		})
} as const;

const publishGiveawayButton = {
	customId: "publishGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "publishGiveaway",
			style: ButtonStyle.Success,
			label: "Publish"
		})
} as const;

const publishingOptionsButton = {
	customId: "publishingOptions",
	component: () =>
		new ButtonBuilder({
			customId: "publishingOptions",
			style: ButtonStyle.Success,
			label: "Publishing Options"
		})
} as const;

const lockGiveawayEntriesButton = {
	customId: "lockEntries",
	component: () =>
		new ButtonBuilder({
			customId: "lockEntries",
			style: ButtonStyle.Secondary,
			emoji: EMOJIS.LOCK,
			label: "Lock entries"
		})
} as const;

const unlockGiveawayEntriesButton = {
	customId: "unlockEntries",
	component: () =>
		new ButtonBuilder({
			customId: "unlockEntries",
			emoji: EMOJIS.UNLOCK,
			label: "Unlock entries",
			style: ButtonStyle.Secondary
		})
} as const;

const setEndDateButton = {
	customId: "setEndDate",
	component: () =>
		new ButtonBuilder({
			customId: "setEndDate",
			style: ButtonStyle.Secondary,
			label: "Set end date"
		})
} as const;

const setRequiredRolesButton = {
	customId: "setRequiredRoles",
	component: () =>
		new ButtonBuilder({
			customId: "setRequiredRoles",
			style: ButtonStyle.Secondary,
			label: "Set required roles"
		})
} as const;

const clearRequiredRolesButton = {
	customId: "clearRequiredRoles",
	component: () =>
		new ButtonBuilder({
			customId: "clearRequiredRoles",
			style: ButtonStyle.Secondary,
			label: "Clear required roles"
		})
} as const;

const setPingRolesToAtEveryoneButton = {
	customId: "setPingRolesToAtEveryone",
	component: () =>
		new ButtonBuilder({
			customId: "setPingRolesToAtEveryone",
			style: ButtonStyle.Primary,
			label: "Set to @everyone"
		})
} as const;

const setPingRolesButton = {
	customId: "setPingRoles",
	component: () =>
		new ButtonBuilder({
			customId: "setPingRoles",
			style: ButtonStyle.Secondary,
			label: "Set ping roles"
		})
} as const;

const clearPingRolesButton = {
	customId: "clearPingRoles",
	component: () =>
		new ButtonBuilder({
			customId: "clearPingRoles",
			style: ButtonStyle.Secondary,
			label: "Clear ping roles"
		})
} as const;

const editButton = {
	customId: "edit",
	component: () =>
		new ButtonBuilder({
			customId: "edit",
			style: ButtonStyle.Primary,
			emoji: EMOJIS.EDIT,
			label: "Edit"
		})
} as const;

const manageGiveawayPrizesButton = {
	customId: "managePrizes",
	component: () =>
		new ButtonBuilder({
			customId: "managePrizes",
			style: ButtonStyle.Success,
			label: "Manage prizes"
		})
} as const;

const endGiveawayButton = {
	customId: "endGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "endGiveaway",
			style: ButtonStyle.Primary,
			label: "End giveaway"
		})
} as const;

const resetDataButton = {
	customId: "resetData",
	component: () =>
		new ButtonBuilder({
			customId: "resetData",
			style: ButtonStyle.Primary,
			label: "Reset data"
		})
} as const;

const deleteGiveawayButton = {
	customId: "deleteGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "deleteGiveaway",
			style: ButtonStyle.Danger,
			label: "Delete giveaway"
		})
} as const;

const lastChannelButton = {
	customId: "lastChannel",
	component: () =>
		new ButtonBuilder({
			customId: "lastChannel",
			label: "Use the previous channel",
			style: ButtonStyle.Primary
		})
} as const;

const editCurrentMessageButton = {
	customId: "editCurrent",
	component: () =>
		new ButtonBuilder({
			customId: "editCurrent",
			label: "Edit current message",
			style: ButtonStyle.Success
		})
} as const;

const recallCurrentMessageButton = {
	customId: "recallCurrent",
	component: () =>
		new ButtonBuilder({
			customId: "recallCurrent",
			label: "Recall current message",
			style: ButtonStyle.Danger
		})
} as const;

const enterGiveawayButton = {
	customId: (id: number) => `enter-giveaway-${id}`,
	component: (id: number) =>
		new ButtonBuilder({
			customId: `enter-giveaway-${id}`,
			label: "Enter",
			style: ButtonStyle.Success,
			emoji: EMOJIS.ENTER_GIVEAWAY_EMOJI
		})
} as const;

const reactivateGiveawayButton = {
	customId: "reactivateGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "reactivateGiveaway",
			label: "Reactivate giveaway",
			style: ButtonStyle.Secondary
		})
} as const;

const publishWinnersButton = {
	customId: "publishWinners",
	component: () =>
		new ButtonBuilder({
			customId: "publishWinners",
			label: "Publish winners",
			style: ButtonStyle.Success
		})
} as const;

const republishWinnersButton = {
	customId: "republishWinners",
	component: () =>
		new ButtonBuilder({
			customId: "republishWinners",
			label: "Republish winners",
			style: ButtonStyle.Success
		})
} as const;

const unpublishWinnersButton = {
	customId: "unpublishWinners",
	component: () =>
		new ButtonBuilder({
			customId: "unpublishWinners",
			label: "Unpublish winners",
			style: ButtonStyle.Secondary
		})
} as const;

const showAllWinnersButton = {
	customId: "showAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "showAllWinners",
			label: "Show all winners",
			style: ButtonStyle.Primary
		})
} as const;

const rerollWinnersButton = {
	customId: "rerollWinners",
	component: () =>
		new ButtonBuilder({
			customId: "rerollWinners",
			label: "Reroll unclaimed",
			style: ButtonStyle.Secondary
		})
} as const;

const rerollAllWinnersButton = {
	customId: "rerollAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "rerollAllWinners",
			label: "Reroll all",
			style: ButtonStyle.Danger
		})
} as const;

const deleteUnclaimedWinnersButton = {
	customId: "deleteUnclaimedWinners",
	component: () =>
		new ButtonBuilder({
			customId: "deleteUnclaimedWinners",
			label: "Delete unclaimed",
			style: ButtonStyle.Secondary
		})
} as const;

const deleteAllWinnersButton = {
	customId: "deleteAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "deleteAllWinners",
			label: "Delete all",
			style: ButtonStyle.Danger
		})
} as const;

const enableButton = {
	customId: "enable",
	component: () =>
		new ButtonBuilder({
			customId: "enable",
			label: "Enable",
			style: ButtonStyle.Success
		})
} as const;

const disableButton = {
	customId: "disable",
	component: () =>
		new ButtonBuilder({
			label: "Disable",
			customId: "disable",
			style: ButtonStyle.Danger
		})
} as const;

const roleSelectMenu = {
	customId: "roleSelect",
	component: (min = 1, max = 10) =>
		new RoleSelectMenuBuilder({
			customId: "roleSelect",
			minValues: min,
			maxValues: max
		})
} as const;

const channelSelectMenu = {
	customId: "channelSelect",
	component: ({
		channelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement],
		max = 1,
		min = 1
	}: {
		channelTypes?: Array<ChannelType>;
		max?: number;
		min?: number;
	} = {}) =>
		new ChannelSelectMenuBuilder()
			.setChannelTypes(channelTypes)
			.setCustomId("channelSelect")
			.setMaxValues(max)
			.setMinValues(min)
};

const clearRolesButton = {
	customId: "clearRoles",
	component: () =>
		new ButtonBuilder({
			customId: "clearRoles",
			style: ButtonStyle.Secondary,
			label: "Clear roles"
		})
} as const;

const backButton = {
	customId: "back",
	component: () =>
		new ButtonBuilder({
			customId: "back",
			label: "Back",
			style: ButtonStyle.Secondary
		})
} as const;

const acceptAllPrizesButton = {
	customId: "acceptAllPrizes",
	component: () =>
		new ButtonBuilder({
			customId: "acceptAllPrizes",
			emoji: EMOJIS.TADA,
			label: "Accept all prizes",
			style: ButtonStyle.Success
		})
} as const;

const viewAllEnteredButton = {
	customId: "viewAllEntered",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllEntered",
			label: "View entered",
			style: ButtonStyle.Secondary
		})
} as const;

const viewAllPrizesButton = {
	customId: "viewAllPrizes",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllPrizes",
			label: "View prizes",
			style: ButtonStyle.Secondary
		})
} as const;

const viewAllHostedButton = {
	customId: "viewAllHosted",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllHosted",
			label: "View hosted",
			style: ButtonStyle.Secondary
		})
} as const;

const yesButton = {
	customId: "yes",
	component: (style: ButtonStyle) =>
		new ButtonBuilder()
			.setCustomId("yes")
			.setEmoji(EMOJIS.V)
			.setStyle(style)
			.setLabel("Yes")
};

const noButton = {
	customId: "no",
	component: (style: ButtonStyle) =>
		new ButtonBuilder()
			.setCustomId("no")
			.setEmoji(EMOJIS.X)
			.setStyle(style)
			.setLabel("No")
};

const selects = {
	channelSelect: channelSelectMenu,
	roleSelect: roleSelectMenu
} as const;

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
	edit: editButton,
	yes: yesButton,
	no: noButton
} as const;

const components = {
	buttons,
	modals,
	selects
} as const;

export default components;
