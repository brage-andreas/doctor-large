import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";
import { EMOJIS, GIVEAWAY } from "../constants.js";
import { modalId } from "../helpers/ModalCollector.js";

interface ComponentParams {
	customId?: true;
}

function wrap<T extends ButtonBuilder | ModalBuilder>(): () => T;
function wrap<T extends ButtonBuilder | ModalBuilder>(): ({
	customId
}: ComponentParams) => string;
function wrap<T extends ButtonBuilder | ModalBuilder>(): ({
	customId
}: ComponentParams) => T | string {
	return ({ customId }: ComponentParams): T | string =>
		customId
			? publishGiveawayButton.customId
			: publishGiveawayButton.component;
}

// -----------------------
//         CREATE
// -----------------------

const modalGiveawayTitle = {
	customId: "title", // ------ Match these
	component: new TextInputBuilder()
		.setCustomId("title") // Match these // Match these
		.setLabel("Title")
		.setMaxLength(GIVEAWAY.MAX_TITLE_LEN)
		.setStyle(TextInputStyle.Short)
		.setRequired(true)
		.setPlaceholder("Christmas Giveaway 2022!")
} as const;

const modalGiveawayDescription = {
	customId: "description", // ------ Match these
	component: new TextInputBuilder()
		.setCustomId("description") // Match these
		.setLabel(`Description (max ${GIVEAWAY.MAX_DESCRIPTION_LINES} lines)`)
		.setMaxLength(GIVEAWAY.MAX_DESCRIPTION_LEN)
		.setStyle(TextInputStyle.Paragraph)
		.setPlaceholder(
			oneLine`
				It's this time of year again!
				This is a thanks for a good year 💝
			`
		)
} as const;

const modalGiveawaywinnerQuantity = {
	customId: "winnerQuantity", // ------ Match these
	component: new TextInputBuilder()
		.setCustomId("winnerQuantity") // Match these
		.setLabel("Number of winners")
		.setMaxLength(GIVEAWAY.MAX_WINNER_QUANTITY_LEN)
		.setStyle(TextInputStyle.Short)
		.setPlaceholder("1")
} as const;

/**
 * Children: title, description, winnerQuantity
 */
const createOptionsModal = {
	customId: "CUSTOM",
	component: new ModalBuilder()
		.setTitle("Create a giveaway")
		.setCustomId(modalId())
		.setComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayTitle.component
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayDescription.component
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawaywinnerQuantity.component
			)
		)
} as const;

// -----------------------
//          EDIT
// -----------------------

const modalGiveawayNewTitle = {
	customId: "newTitle", // ------ Match these
	component: (oldTitle: string) =>
		new TextInputBuilder()
			.setCustomId("newTitle") // Match these
			.setLabel("New Title")
			.setMaxLength(GIVEAWAY.MAX_TITLE_LEN)
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setValue(oldTitle)
			.setPlaceholder(oldTitle)
} as const;

const emptyString = `${EMOJIS.SLEEP} Whoa so empty — there is no description`;

const modalGiveawayNewDescription = {
	customId: "newDescription", // ------ Match these
	component: (oldDescription: string | null) => {
		const builder = new TextInputBuilder()
			.setCustomId("newDescription") // Match these
			.setLabel(
				`New description (max ${GIVEAWAY.MAX_DESCRIPTION_LINES} lines)`
			)
			.setMaxLength(GIVEAWAY.MAX_DESCRIPTION_LEN)
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		if (oldDescription) {
			builder.setValue(oldDescription);
			builder.setPlaceholder(oldDescription ?? emptyString);
		}

		return builder;
	}
} as const;

const modalGiveawayNewWinnerQuantity = {
	customId: "newWinnerQuantity", // ------ Match these
	component: (oldNumberOfWinners: number) =>
		new TextInputBuilder()
			.setCustomId("newWinnerQuantity") // Match these
			.setLabel("New number of winners")
			.setMaxLength(GIVEAWAY.MAX_WINNER_QUANTITY_LEN)
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setValue(oldNumberOfWinners.toString())
			.setPlaceholder(oldNumberOfWinners.toString())
} as const;

/**
 * Children: newTitle, newDescription, newWinnerQuantity
 */
const editOptionsModal = {
	customId: "CUSTOM",
	component: (
		id: number,
		oldTitle: string,
		oldDescription: string | null,
		oldWinnerQuantity: number
	) =>
		new ModalBuilder()
			.setTitle(`Edit giveaway #${id} (3 min)`)
			.setCustomId(modalId())
			.setComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					modalGiveawayNewTitle.component(oldTitle)
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					modalGiveawayNewDescription.component(oldDescription)
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					modalGiveawayNewWinnerQuantity.component(oldWinnerQuantity)
				)
			)
} as const;

// -----------------------
//        DASHBOARD
// -----------------------

const publishGiveawayButton = {
	customId: "publishGiveaway", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("publishGiveaway") // Match these
		.setStyle(ButtonStyle.Success)
		.setLabel("Publish")
} as const;

const publishingOptionsButton = {
	customId: "publishingOptions", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("publishingOptions") // Match these
		.setStyle(ButtonStyle.Success)
		.setLabel("Publishing Options")
} as const;

const lockGiveawayEntriesButton = {
	customId: "lockEntries", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("lockEntries") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(EMOJIS.LOCK)
		.setLabel("Lock entries")
} as const;

const unlockGiveawayEntriesButton = {
	customId: "unlockEntries", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("unlockEntries") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setEmoji(EMOJIS.UNLOCK)
		.setLabel("Unlock entries")
} as const;

const setEndDateButton = {
	customId: "setEndDate", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("setEndDate") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setLabel("Set end date")
} as const;

const setRequiredRolesButton = {
	customId: "setRequiredRoles", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("setRequiredRoles") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setLabel("Set required roles")
} as const;

const clearRequiredRolesButton = {
	customId: "clearRequiredRoles", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("clearRequiredRoles") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setLabel("Clear required roles")
} as const;

const setPingRolesToAtEveryoneButton = {
	customId: "setPingRolesToAtEveryone", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("setPingRolesToAtEveryone") // Match these
		.setStyle(ButtonStyle.Primary)
		.setLabel("Set to @everyone")
} as const;

const setPingRolesButton = {
	customId: "setPingRoles", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("setPingRoles") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setLabel("Set ping roles")
} as const;

const clearPingRolesButton = {
	customId: "clearPingRoles", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("clearPingRoles") // Match these
		.setStyle(ButtonStyle.Secondary)
		.setLabel("Clear ping roles")
} as const;

const editGiveawayButton = {
	customId: "editGiveaway", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("editGiveaway") // Match these
		.setStyle(ButtonStyle.Primary)
		.setEmoji(EMOJIS.EDIT)
		.setLabel("Edit")
} as const;

const manageGiveawayPrizesButton = {
	customId: "managePrizes", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("managePrizes") // Match these
		.setStyle(ButtonStyle.Success)
		.setLabel("Manage prizes")
} as const;

const endGiveawayButton = {
	customId: "endGiveaway", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("endGiveaway") // Match these
		.setStyle(ButtonStyle.Primary)
		.setLabel("End giveaway")
} as const;

const resetDataButton = {
	customId: "resetData", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("resetData") // Match these
		.setStyle(ButtonStyle.Primary)
		.setLabel("Reset data")
} as const;

const deleteGiveawayButton = {
	customId: "deleteGiveaway", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("deleteGiveaway") // Match these
		.setStyle(ButtonStyle.Danger)
		.setLabel("Delete giveaway")
} as const;

// -----------------------

const lastChannelButton = {
	customId: "lastChannel", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("lastChannel") // Match these
		.setLabel("Use the previous channel")
		.setStyle(ButtonStyle.Primary)
} as const;

const editCurrentMessageButton = {
	customId: "editCurrent", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("editCurrent") // Match these
		.setLabel("Edit current message")
		.setStyle(ButtonStyle.Success)
} as const;

const recallCurrentMessageButton = {
	customId: "recallCurrent", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("recallCurrent") // Match these
		.setLabel("Recall current message")
		.setStyle(ButtonStyle.Danger)
} as const;

const enterGiveawayButton = {
	customId: "CUSTOM",
	component: (id: number) =>
		new ButtonBuilder()
			.setCustomId(`enter-giveaway-${id}`)
			.setLabel("Enter")
			.setStyle(ButtonStyle.Success)
			.setEmoji(EMOJIS.ENTER_GIVEAWAY_EMOJI)
} as const;

// -----------------------
//     ENDED DASHBOARD
// -----------------------

const reactivateGiveawayButton = {
	customId: "reactivateGiveaway", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("reactivateGiveaway") // Match these
		.setLabel("Reactivate giveaway")
		.setStyle(ButtonStyle.Secondary)
} as const;

const publishWinnersButton = {
	customId: "publishWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("publishWinners") // Match these
		.setLabel("Publish winners")
		.setStyle(ButtonStyle.Success)
} as const;

const republishWinnersButton = {
	customId: "republishWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("republishWinners") // Match these
		.setLabel("Republish winners")
		.setStyle(ButtonStyle.Success)
} as const;

const unpublishWinnersButton = {
	customId: "unpublishWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("unpublishWinners") // Match these
		.setLabel("Unpublish winners")
		.setStyle(ButtonStyle.Secondary)
} as const;

const showAllWinnersButton = {
	customId: "showAllWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("showAllWinners") // Match these
		.setLabel("Show all winners")
		.setStyle(ButtonStyle.Primary)
} as const;

const rerollWinnersButton = {
	customId: "rerollWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("rerollWinners") // Match these
		.setLabel("Reroll unclaimed")
		.setStyle(ButtonStyle.Secondary)
} as const;

const rerollAllWinnersButton = {
	customId: "rerollAllWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("rerollAllWinners") // Match these
		.setLabel("Reroll all")
		.setStyle(ButtonStyle.Danger)
} as const;

const deleteUnclaimedWinnersButton = {
	customId: "deleteUnclaimedWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("deleteUnclaimedWinners") // Match these
		.setLabel("Delete unclaimed")
		.setStyle(ButtonStyle.Secondary)
} as const;

const deleteAllWinnersButton = {
	customId: "deleteAllWinners", // ------ Match these
	component: new ButtonBuilder()
		.setCustomId("deleteAllWinners") // Match these
		.setLabel("Delete all")
		.setStyle(ButtonStyle.Danger)
} as const;

// -----------------------

const modals = {
	/**
	 * Children: title, description, numberOfWinners
	 */
	createGiveaway: ({ customId }: ComponentParams) =>
		customId ? createOptionsModal.customId : createOptionsModal.component,

	/**
	 * Children: newTitle, newDescription, newWinnerQuantity
	 */
	editGiveaway: (
		id: number,
		oldTitle: string,
		oldDescription: string | null,
		oldWinnerQuantity: number
	) =>
		editOptionsModal.component(
			id,
			oldTitle,
			oldDescription,
			oldWinnerQuantity
		)
} as const;

const buttons = {
	publishGiveaway: ({ customId }: ComponentParams) =>
		customId
			? publishGiveawayButton.customId
			: publishGiveawayButton.component,

	publishingOptions: ({ customId }: ComponentParams) =>
		customId
			? publishingOptionsButton.customId
			: publishingOptionsButton.component,

	lockEntries: ({ customId }: ComponentParams) =>
		customId
			? lockGiveawayEntriesButton.customId
			: lockGiveawayEntriesButton.component,

	unlockEntries: ({ customId }: ComponentParams) =>
		customId
			? unlockGiveawayEntriesButton.customId
			: unlockGiveawayEntriesButton.component,

	setEndDate: ({ customId }: ComponentParams) =>
		customId ? setEndDateButton.customId : setEndDateButton.component,

	setRequiredRoles: ({ customId }: ComponentParams) =>
		customId
			? setRequiredRolesButton.customId
			: setRequiredRolesButton.component,

	setPingRoles: ({ customId }: ComponentParams) =>
		customId ? setPingRolesButton.customId : setPingRolesButton.component,

	editGiveaway: ({ customId }: ComponentParams) =>
		customId ? editGiveawayButton.customId : editGiveawayButton.component,

	managePrizes: ({ customId }: ComponentParams) =>
		customId
			? manageGiveawayPrizesButton.customId
			: manageGiveawayPrizesButton.component,

	endGiveaway: ({ customId }: ComponentParams) =>
		customId ? endGiveawayButton.customId : endGiveawayButton.component,

	resetData: ({ customId }: ComponentParams) =>
		customId ? resetDataButton.customId : resetDataButton.component,

	deleteGiveaway: ({ customId }: ComponentParams) =>
		customId
			? deleteGiveawayButton.customId
			: deleteGiveawayButton.component,

	clearRequiredRoles: ({ customId }: ComponentParams) =>
		customId
			? clearRequiredRolesButton.customId
			: clearRequiredRolesButton.component,

	setPingRolesToAtEveryone: ({ customId }: ComponentParams) =>
		customId
			? setPingRolesToAtEveryoneButton.customId
			: setPingRolesToAtEveryoneButton.component,

	clearPingRoles: ({ customId }: ComponentParams) =>
		customId
			? clearPingRolesButton.customId
			: clearPingRolesButton.component,

	lastChannel: ({ customId }: ComponentParams) =>
		customId ? lastChannelButton.customId : lastChannelButton.component,

	editCurrentMessage: ({ customId }: ComponentParams) =>
		customId
			? editCurrentMessageButton.customId
			: editCurrentMessageButton.component,

	recallCurrentMessage: ({ customId }: ComponentParams) =>
		customId
			? recallCurrentMessageButton.customId
			: recallCurrentMessageButton.component,

	enterGiveaway: (id: number) => enterGiveawayButton.component(id),

	reactivateGiveaway: ({ customId }: ComponentParams) =>
		customId
			? reactivateGiveawayButton.customId
			: reactivateGiveawayButton.component,

	publishWinners: ({ customId }: ComponentParams) =>
		customId
			? publishWinnersButton.customId
			: publishWinnersButton.component,

	republishWinners: ({ customId }: ComponentParams) =>
		customId
			? republishWinnersButton.customId
			: republishWinnersButton.component,

	unpublishWinners: ({ customId }: ComponentParams) =>
		customId
			? unpublishWinnersButton.customId
			: unpublishWinnersButton.component,

	showAllWinners: ({ customId }: ComponentParams) =>
		customId
			? showAllWinnersButton.customId
			: showAllWinnersButton.component,

	rerollWinners: ({ customId }: ComponentParams) =>
		customId ? rerollWinnersButton.customId : rerollWinnersButton.component,

	rerollAllWinners: ({ customId }: ComponentParams) =>
		customId
			? rerollAllWinnersButton.customId
			: rerollAllWinnersButton.component,

	deleteUnclaimedWinners: ({ customId }: ComponentParams) =>
		customId
			? deleteUnclaimedWinnersButton.customId
			: deleteUnclaimedWinnersButton.component,

	deleteAllWinners: ({ customId }: ComponentParams) =>
		customId
			? deleteAllWinnersButton.customId
			: deleteAllWinnersButton.component
} as const;

export const giveaway = {
	buttons,
	modals
} as const;
