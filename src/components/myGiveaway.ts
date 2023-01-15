import { ButtonBuilder, ButtonStyle } from "discord.js";
import { EMOJIS } from "../constants.js";

// -----------------------

/**
 * ID: acceptAllPrizes
 */
const acceptAllPrizesButton = new ButtonBuilder()
	.setCustomId("acceptAllPrizes")
	.setEmoji(EMOJIS.TADA)
	.setLabel("Accept all prizes")
	.setStyle(ButtonStyle.Success);

/**
 * ID: viewAllEntered
 */
const viewAllEnteredButton = new ButtonBuilder()
	.setCustomId("viewAllEntered")
	.setLabel("View entered")
	.setStyle(ButtonStyle.Secondary);

/**
 * ID: viewAllPrizes
 */
const viewAllPrizesButton = new ButtonBuilder()
	.setCustomId("viewAllPrizes")
	.setLabel("View prizes")
	.setStyle(ButtonStyle.Secondary);

/**
 * viewAllHosted
 */
const viewAllHostedButton = new ButtonBuilder()
	.setCustomId("viewAllHosted")
	.setLabel("View hosted")
	.setStyle(ButtonStyle.Secondary);

// -----------------------

const buttons = {
	/**
	 * ID: acceptAllPrizes
	 */
	acceptAllPrizes: () => acceptAllPrizesButton,

	/**
	 * ID: viewAllEntered
	 */
	viewAllEntered: () => viewAllEnteredButton,

	/**
	 * ID: viewAllPrizes
	 */
	viewAllPrizes: () => viewAllPrizesButton,

	/**
	 * ID: viewAllHosted
	 */
	viewAllHosted: () => viewAllHostedButton
};

export const myGiveaway = {
	buttons
};
