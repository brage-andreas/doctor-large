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

const modalGiveawayTitle = new TextInputBuilder()
	.setCustomId("title")
	.setLabel("Title")
	.setMaxLength(50)
	.setStyle(TextInputStyle.Short)
	.setRequired(true)
	.setPlaceholder("Christmas Giveaway 2022!");

const modalGiveawayDescription = new TextInputBuilder()
	.setCustomId("description")
	.setLabel("Description [None]")
	.setMaxLength(512)
	.setStyle(TextInputStyle.Paragraph)
	.setPlaceholder(
		oneLine`
				It's this time of year again!
				This is a thanks for a good year 💝
			`
	);

const modalGiveawayNumberOfWinners = new TextInputBuilder()
	.setCustomId("number-of-winners")
	.setLabel("Number of winners [1]")
	.setMaxLength(2)
	.setStyle(TextInputStyle.Short)
	.setPlaceholder("1");

const createOptionsModal = new ModalBuilder()
	.setTitle("Create a giveaway (3 min)")
	.setCustomId("giveawayCreate")
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

const openInDashboardButton = new ButtonBuilder()
	.setCustomId("create-to-dashboard")
	.setLabel("Open in dashboard")
	.setStyle(ButtonStyle.Secondary);

// -----------------------
//          EDIT
// -----------------------

const modalGiveawayNewTitle = (oldTitle: string) =>
	new TextInputBuilder()
		.setCustomId("new-title")
		.setLabel("New Title")
		.setMaxLength(50)
		.setStyle(TextInputStyle.Short)
		.setRequired(true)
		.setValue(oldTitle)
		.setPlaceholder(oldTitle);

const emptyString = "😴 Whoa so empty — there is no description";

const modalGiveawayNewDescription = (oldDescription: string | null) =>
	new TextInputBuilder()
		.setCustomId("new-description")
		.setLabel("New description [None]")
		.setMaxLength(512)
		.setStyle(TextInputStyle.Paragraph)
		.setValue(oldDescription ?? emptyString)
		.setPlaceholder(oldDescription ?? emptyString);

const modalGiveawayNewNumberOfWinners = (oldNumberOfWinners: number) =>
	new TextInputBuilder()
		.setCustomId("new-number-of-winners")
		.setLabel("New number of winners [1]")
		.setMaxLength(2)
		.setStyle(TextInputStyle.Short)
		.setValue(oldNumberOfWinners.toString())
		.setPlaceholder(oldNumberOfWinners.toString());

const editOptionsModal = (
	id: number,
	oldTitle: string,
	oldDescription: string | null,
	oldNumberOfWinners: number
) =>
	new ModalBuilder()
		.setTitle(`Edit giveaway #${id} (3 min)`)
		.setCustomId("giveawayEdit")
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

const publishGiveawayButton = new ButtonBuilder()
	.setCustomId("publishGiveaway")
	.setStyle(ButtonStyle.Success)
	.setLabel("Publish");

const republishGiveawayButton = new ButtonBuilder()
	.setCustomId("republishGiveaway")
	.setStyle(ButtonStyle.Success)
	.setLabel("Republish");

const lockGiveawayEntriesButton = new ButtonBuilder()
	.setCustomId("lockEntries")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Lock entries");

const unlockGiveawayEntriesButton = new ButtonBuilder()
	.setCustomId("unlockEntries")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Unlock entries");

const setRequiredRolesButton = new ButtonBuilder()
	.setCustomId("setRequiredRoles")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Set roles");

const clearRequiredRolesButton = new ButtonBuilder()
	.setCustomId("clearRequiredRoles")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Clear roles");

const editGiveawayButton = new ButtonBuilder()
	.setCustomId("giveawayEditButton")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Edit");

const manageGiveawayPrizesButton = new ButtonBuilder()
	.setCustomId("prizesManage")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Manage prizes");

const endGiveawayButton = new ButtonBuilder()
	.setCustomId("endGiveaway")
	.setStyle(ButtonStyle.Danger)
	.setLabel("End giveaway");

// -----------------------

export const giveaway = {
	create: {
		optionsModal: () => createOptionsModal,
		dashboardButton: () => openInDashboardButton
	},
	edit: {
		editOptionsModal: (
			id: number,
			oldTitle: string,
			oldDescription: string | null,
			oldNumberOfWinners: number
		) => editOptionsModal(id, oldTitle, oldDescription, oldNumberOfWinners)
	},
	dashboard: {
		row1: {
			publishButton: () => publishGiveawayButton,
			republishButton: () => republishGiveawayButton,
			lockEntriesButton: () => lockGiveawayEntriesButton,
			unlockEntriesButton: () => unlockGiveawayEntriesButton,
			setRolesButton: () => setRequiredRolesButton,
			clearRolesButton: () => clearRequiredRolesButton
		},
		row2: {
			editButton: () => editGiveawayButton,
			endButton: () => endGiveawayButton,
			managePrizesButton: () => manageGiveawayPrizesButton
		}
	}
};
