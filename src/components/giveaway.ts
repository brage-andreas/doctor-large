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

export const giveaway = {
	create: {
		optionsModal: () => structuredClone(createOptionsModal),
		dashboardButton: () => structuredClone(openInDashboardButton)
	}
};
