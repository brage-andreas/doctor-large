import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle
} from "discord.js";

// -----------------------
//         CREATE
// -----------------------

/**
 * ID: title
 */
const modalGiveawayTitle = new TextInputBuilder()
	.setCustomId("title")
	.setLabel("Title")
	.setMaxLength(50)
	.setStyle(TextInputStyle.Short)
	.setRequired(true)
	.setPlaceholder("Christmas Giveaway 2022!");

/**
 * ID: description
 */
const modalGiveawayDescription = new TextInputBuilder()
	.setCustomId("description")
	.setLabel("Description (max 20 lines)")
	.setMaxLength(200)
	.setStyle(TextInputStyle.Paragraph)
	.setPlaceholder(
		oneLine`
				It's this time of year again!
				This is a thanks for a good year 💝
			`
	);

/**
 * ID: numberOfWinners
 */
const modalGiveawayNumberOfWinners = new TextInputBuilder()
	.setCustomId("numberOfWinners")
	.setLabel("Number of winners")
	.setMaxLength(1)
	.setStyle(TextInputStyle.Short)
	.setPlaceholder("1");

/**
 * ID: createGiveaway
 *
 * Children: title, description, numberOfWinners
 */
const createOptionsModal = new ModalBuilder()
	.setTitle("Create a giveaway")
	.setCustomId("createGiveaway")
	.setComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayTitle
		),
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayDescription
		),
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayNumberOfWinners
		)
	);

/**
 * ID: openInDashboard
 */
const openInDashboardButton = new ButtonBuilder()
	.setCustomId("openInDashboard")
	.setLabel("Open in dashboard")
	.setStyle(ButtonStyle.Secondary);

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
		.setMaxLength(50)
		.setStyle(TextInputStyle.Short)
		.setRequired(true)
		.setValue(oldTitle)
		.setPlaceholder(oldTitle);

const emptyString = "😴 Whoa so empty — there is no description";

/**
 * ID: newDescription
 */
const modalGiveawayNewDescription = (oldDescription: string | null) =>
	new TextInputBuilder()
		.setCustomId("newDescription")
		.setLabel("New description (max 20 lines)")
		.setMaxLength(200)
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true)
		.setValue(oldDescription ?? emptyString)
		.setPlaceholder(oldDescription ?? emptyString);

/**
 * ID: newNumberOfWinners
 */
const modalGiveawayNewNumberOfWinners = (oldNumberOfWinners: number) =>
	new TextInputBuilder()
		.setCustomId("newNumberOfWinners")
		.setLabel("New number of winners")
		.setMaxLength(1)
		.setStyle(TextInputStyle.Short)
		.setRequired(true)
		.setValue(oldNumberOfWinners.toString())
		.setPlaceholder(oldNumberOfWinners.toString());

/**
 * ID: editGiveaway
 *
 * Children: newTitle, newDescription, newNumberOfWinners
 */
const editOptionsModal = (
	id: number,
	oldTitle: string,
	oldDescription: string | null,
	oldNumberOfWinners: number
) =>
	new ModalBuilder()
		.setTitle(`Edit giveaway #${id} (3 min)`)
		.setCustomId("editGiveaway")
		.setComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayNewTitle(oldTitle)
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayNewDescription(oldDescription)
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				modalGiveawayNewNumberOfWinners(oldNumberOfWinners)
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
	.setEmoji("🔒")
	.setLabel("Lock entries");

/**
 * ID: unlockEntries
 */
const unlockGiveawayEntriesButton = new ButtonBuilder()
	.setCustomId("unlockEntries")
	.setStyle(ButtonStyle.Secondary)
	.setEmoji("🔓")
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
	.setEmoji("✍️")
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
 * ID: back
 */
const backButton = new ButtonBuilder()
	.setCustomId("back")
	.setLabel("Back")
	.setStyle(ButtonStyle.Secondary);

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
 * ID: enter-giveaway-{giveawayId}
 */
const enterGiveawayButton = (giveawayId: number) =>
	new ButtonBuilder()
		.setCustomId(`enter-giveaway-${giveawayId}`)
		.setLabel("Enter")
		.setStyle(ButtonStyle.Success)
		.setEmoji("🎁");

// -----------------------

export const giveaway = {
	create: {
		/**
		 * ID: createGiveaway
		 *
		 * Children: title, description, numberOfWinners
		 */
		optionsModal: () => createOptionsModal,
		/**
		 * ID: openInDashboard
		 */
		dashboardButton: () => openInDashboardButton
	},
	edit: {
		/**
		 * ID: editGiveaway
		 *
		 * Children: newTitle, newDescription, newNumberOfWinners
		 */
		editOptionsModal: (
			id: number,
			oldTitle: string,
			oldDescription: string | null,
			oldNumberOfWinners: number
		) => editOptionsModal(id, oldTitle, oldDescription, oldNumberOfWinners)
	},
	dashboard: {
		row1: {
			/**
			 * ID: publishGiveaway
			 */
			publishGiveawayButton: () => publishGiveawayButton,

			/**
			 * ID: publishingOptions
			 */
			publishingOptionsButton: () => publishingOptionsButton,

			/**
			 * ID: lockEntries
			 */
			lockEntriesButton: () => lockGiveawayEntriesButton,

			/**
			 * ID: unlockEntries
			 */
			unlockEntriesButton: () => unlockGiveawayEntriesButton,

			/**
			 * ID: setEndDate
			 */
			setEndDateButton: () => setEndDateButton,

			/**
			 * ID: setRequiredRoles
			 */
			setRequiredRolesButton: () => setRequiredRolesButton,

			/**
			 * ID: setPingRoles
			 */
			setPingRolesButton: () => setPingRolesButton
		},
		row2: {
			/**
			 * ID: editGiveaway
			 */
			editButton: () => editGiveawayButton,

			/**
			 * ID: managePrizes
			 */
			managePrizesButton: () => manageGiveawayPrizesButton,

			/**
			 * ID: endGiveaway
			 */
			endGiveawayButton: () => endGiveawayButton,

			/**
			 * ID: resetData
			 */
			resetDataButton: () => resetDataButton,

			/**
			 * ID: deleteGiveaway
			 */
			deleteGiveawayButton: () => deleteGiveawayButton
		},

		/**
		 * ID: clearRequiredRoles
		 */
		clearRequiredRolesButton: () => clearRequiredRolesButton,

		/**
		 * ID: clearPingRoles
		 */
		clearPingRolesButton: () => clearPingRolesButton,

		/**
		 * ID: back
		 */
		backButton: () => backButton,

		/**
		 * ID: lastChannel
		 */
		lastChannelButton: () => lastChannelButton,

		/**
		 * ID: editCurrent
		 */
		editCurrentMessageButton: () => editCurrentMessageButton,

		/**
		 * ID: recallCurrent
		 */
		recallCurrentMessageButton: () => recallCurrentMessageButton,

		/**
		 * ID: enter-giveaway-{giveawayId}
		 */
		enterGiveawayButton: (giveawayId: number) =>
			enterGiveawayButton(giveawayId)
	}
};
