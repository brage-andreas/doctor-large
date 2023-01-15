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

// -----------------------
//         CREATE
// -----------------------

/**
 * ID: title
 */
const modalGiveawayTitle = new TextInputBuilder()
	.setCustomId("title")
	.setLabel("Title")
	.setMaxLength(GIVEAWAY.MAX_TITLE_LEN)
	.setStyle(TextInputStyle.Short)
	.setRequired(true)
	.setPlaceholder("Christmas Giveaway 2022!");

/**
 * ID: description
 */
const modalGiveawayDescription = new TextInputBuilder()
	.setCustomId("description")
	.setLabel(`Description (max ${GIVEAWAY.MAX_DESCRIPTION_LINES} lines)`)
	.setMaxLength(GIVEAWAY.MAX_DESCRIPTION_LEN)
	.setStyle(TextInputStyle.Paragraph)
	.setPlaceholder(
		oneLine`
				It's this time of year again!
				This is a thanks for a good year 💝
			`
	);

/**
 * ID: winnerQuantity
 */
const modalGiveawaywinnerQuantity = new TextInputBuilder()
	.setCustomId("winnerQuantity")
	.setLabel("Number of winners")
	.setMaxLength(GIVEAWAY.MAX_WINNER_QUANTITY_LEN)
	.setStyle(TextInputStyle.Short)
	.setPlaceholder("1");

/**
 * ID: createGiveaway
 *
 * Children: title, description, winnerQuantity
 */
const createOptionsModal = new ModalBuilder()
	.setTitle("Create a giveaway")
	.setCustomId(modalId())
	.setComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayTitle
		),
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayDescription
		),
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawaywinnerQuantity
		)
	);

// -----------------------
//          EDIT
// -----------------------

/**
 * ID: newTitle
 */
const modalGiveawayNewTitle = (oldTitle: string) =>
	new TextInputBuilder()
		.setCustomId("newTitle")
		.setLabel("New Title")
		.setMaxLength(GIVEAWAY.MAX_TITLE_LEN)
		.setStyle(TextInputStyle.Short)
		.setRequired(true)
		.setValue(oldTitle)
		.setPlaceholder(oldTitle);

const emptyString = `${EMOJIS.SLEEP} Whoa so empty — there is no description`;

/**
 * ID: newDescription
 */
const modalGiveawayNewDescription = (oldDescription: string | null) => {
	const builder = new TextInputBuilder()
		.setCustomId("newDescription")
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
};

/**
 * ID: newWinnerQuantity
 */
const modalGiveawayNewWinnerQuantity = (oldNumberOfWinners: number) =>
	new TextInputBuilder()
		.setCustomId("newWinnerQuantity")
		.setLabel("New number of winners")
		.setMaxLength(GIVEAWAY.MAX_WINNER_QUANTITY_LEN)
		.setStyle(TextInputStyle.Short)
		.setRequired(true)
		.setValue(oldNumberOfWinners.toString())
		.setPlaceholder(oldNumberOfWinners.toString());

/**
 * ID: editGiveaway
 *
 * Children: newTitle, newDescription, newWinnerQuantity
 */
const editOptionsModal = (
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
				modalGiveawayNewTitle(oldTitle)
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayNewDescription(oldDescription)
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayNewWinnerQuantity(oldWinnerQuantity)
			)
		);

// -----------------------
//        DASHBOARD
// -----------------------

/**
 * ID: publishGiveaway
 */
const publishGiveawayButton = new ButtonBuilder()
	.setCustomId("publishGiveaway")
	.setStyle(ButtonStyle.Success)
	.setLabel("Publish");

/**
 * ID: publishingOptions
 */
const publishingOptionsButton = new ButtonBuilder()
	.setCustomId("publishingOptions")
	.setStyle(ButtonStyle.Success)
	.setLabel("Publishing Options");

/**
 * ID: lockEntries
 */
const lockGiveawayEntriesButton = new ButtonBuilder()
	.setCustomId("lockEntries")
	.setStyle(ButtonStyle.Secondary)
	.setEmoji(EMOJIS.LOCK)
	.setLabel("Lock entries");

/**
 * ID: unlockEntries
 */
const unlockGiveawayEntriesButton = new ButtonBuilder()
	.setCustomId("unlockEntries")
	.setStyle(ButtonStyle.Secondary)
	.setEmoji(EMOJIS.UNLOCK)
	.setLabel("Unlock entries");

/**
 * ID: setEndDate
 */
const setEndDateButton = new ButtonBuilder()
	.setCustomId("setEndDate")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Set end date");

/**
 * ID: setRequiredRoles
 */
const setRequiredRolesButton = new ButtonBuilder()
	.setCustomId("setRequiredRoles")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Set required roles");

/**
 * ID: clearRequiredRoles
 */
const clearRequiredRolesButton = new ButtonBuilder()
	.setCustomId("clearRequiredRoles")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Clear required roles");

/**
 * ID: setRequiredRolesToAtEveryone
 */
const setPingRolesToAtEveryoneButton = new ButtonBuilder()
	.setCustomId("setPingRolesToAtEveryone")
	.setStyle(ButtonStyle.Primary)
	.setLabel("Set to @everyone");

/**
 * ID: setPingRoles
 */
const setPingRolesButton = new ButtonBuilder()
	.setCustomId("setPingRoles")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Set ping roles");

/**
 * ID: clearPingRoles
 */
const clearPingRolesButton = new ButtonBuilder()
	.setCustomId("clearPingRoles")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Clear ping roles");

/**
 * ID: editGiveaway
 */
const editGiveawayButton = new ButtonBuilder()
	.setCustomId("editGiveaway")
	.setStyle(ButtonStyle.Primary)
	.setEmoji(EMOJIS.EDIT)
	.setLabel("Edit");

/**
 * ID: managePrizes
 */
const manageGiveawayPrizesButton = new ButtonBuilder()
	.setCustomId("managePrizes")
	.setStyle(ButtonStyle.Primary)
	.setLabel("Manage prizes");

/**
 * ID: endGiveaway
 */
const endGiveawayButton = new ButtonBuilder()
	.setCustomId("endGiveaway")
	.setStyle(ButtonStyle.Primary)
	.setLabel("End giveaway");

/**
 * ID: resetData
 */
const resetDataButton = new ButtonBuilder()
	.setCustomId("resetData")
	.setStyle(ButtonStyle.Danger)
	.setLabel("Reset data");

/**
 * ID: deleteGiveaway
 */
const deleteGiveawayButton = new ButtonBuilder()
	.setCustomId("deleteGiveaway")
	.setStyle(ButtonStyle.Danger)
	.setLabel("Delete giveaway");

// -----------------------

/**
 * ID: lastChannel
 */
const lastChannelButton = new ButtonBuilder()
	.setCustomId("lastChannel")
	.setLabel("Use the previous channel")
	.setStyle(ButtonStyle.Primary);

/**
 * ID: editCurrent
 */
const editCurrentMessageButton = new ButtonBuilder()
	.setCustomId("editCurrent")
	.setLabel("Edit current message")
	.setStyle(ButtonStyle.Success);

/**
 * ID: recallCurrent
 */
const recallCurrentMessageButton = new ButtonBuilder()
	.setCustomId("recallCurrent")
	.setLabel("Recall current message")
	.setStyle(ButtonStyle.Danger);

/**
 * ID: enter-giveaway-{id}
 */
const enterGiveawayButton = (id: number) =>
	new ButtonBuilder()
		.setCustomId(`enter-giveaway-${id}`)
		.setLabel("Enter")
		.setStyle(ButtonStyle.Success)
		.setEmoji(EMOJIS.ENTER_GIVEAWAY_EMOJI);

// -----------------------
//     ENDED DASHBOARD
// -----------------------

/**
 * ID: reactivate
 */
const reactivateButton = new ButtonBuilder()
	.setCustomId("reactivate")
	.setLabel("Reactivate")
	.setStyle(ButtonStyle.Secondary);

/**
 * ID: publishWinners
 */
const publishWinnersButton = new ButtonBuilder()
	.setCustomId("publishWinners")
	.setLabel("Publish winners")
	.setStyle(ButtonStyle.Success);

/**
 * ID: republishWinners
 */
const republishWinnersButton = new ButtonBuilder()
	.setCustomId("republishWinners")
	.setLabel("Republish winners")
	.setStyle(ButtonStyle.Success);

/**
 * ID: unpublishWinners
 */
const unpublishWinnersButton = new ButtonBuilder()
	.setCustomId("unpublishWinners")
	.setLabel("Unpublish winners")
	.setStyle(ButtonStyle.Secondary);

// -----------------------

const modals = {
	/**
	 * ID: createGiveaway
	 *
	 * Children: title, description, numberOfWinners
	 */
	createGiveaway: () => createOptionsModal,

	/**
	 * ID: editGiveaway
	 *
	 * Children: newTitle, newDescription, newWinnerQuantity
	 */
	editGiveaway: (
		id: number,
		oldTitle: string,
		oldDescription: string | null,
		oldWinnerQuantity: number
	) => editOptionsModal(id, oldTitle, oldDescription, oldWinnerQuantity)
} as const;

const buttons = {
	/**
	 * ID: publishGiveaway
	 */
	publishGiveaway: () => publishGiveawayButton,

	/**
	 * ID: publishingOptions
	 */
	publishingOptions: () => publishingOptionsButton,

	/**
	 * ID: lockEntries
	 */
	lockEntries: () => lockGiveawayEntriesButton,

	/**
	 * ID: unlockEntries
	 */
	unlockEntries: () => unlockGiveawayEntriesButton,

	/**
	 * ID: setEndDate
	 */
	setEndDate: () => setEndDateButton,

	/**
	 * ID: setRequiredRoles
	 */
	setRequiredRoles: () => setRequiredRolesButton,

	/**
	 * ID: setPingRoles
	 */
	setPingRoles: () => setPingRolesButton,

	/**
	 * ID: editGiveaway
	 */
	editGiveaway: () => editGiveawayButton,

	/**
	 * ID: managePrizes
	 */
	managePrizes: () => manageGiveawayPrizesButton,

	/**
	 * ID: endGiveaway
	 */
	endGiveaway: () => endGiveawayButton,

	/**
	 * ID: resetData
	 */
	resetData: () => resetDataButton,

	/**
	 * ID: deleteGiveaway
	 */
	deleteGiveaway: () => deleteGiveawayButton,

	/**
	 * ID: clearRequiredRoles
	 */
	clearRequiredRoles: () => clearRequiredRolesButton,

	/**
	 * ID: setPingRolesToAtEveryone
	 */
	setPingRolesToAtEveryone: () => setPingRolesToAtEveryoneButton,

	/**
	 * ID: clearPingRoles
	 */
	clearPingRoles: () => clearPingRolesButton,

	/**
	 * ID: lastChannel
	 */
	lastChannel: () => lastChannelButton,

	/**
	 * ID: editCurrent
	 */
	editCurrentMessage: () => editCurrentMessageButton,

	/**
	 * ID: recallCurrent
	 */
	recallCurrentMessage: () => recallCurrentMessageButton,

	/**
	 * ID: enter-giveaway-{id}
	 */
	enterGiveaway: (id: number) => enterGiveawayButton(id),

	/**
	 * ID: reactivate
	 */
	reactivateGiveaway: () => reactivateButton,

	/**
	 * ID: publishWinners
	 */
	publishWinners: () => publishWinnersButton,

	/**
	 * ID: republishWinners
	 */
	republishWinners: () => republishWinnersButton,

	/**
	 * ID: unpublishWinners
	 */
	unpublishWinners: () => unpublishWinnersButton
} as const;

export const giveaway = {
	buttons,
	modals
};
