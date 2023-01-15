import { ButtonBuilder, ButtonStyle } from "discord.js";
import { giveaway } from "./giveaway.js";
import { myGiveaway } from "./myGiveaway.js";

/**
 * ID: back
 */
const backButton = () =>
	new ButtonBuilder()
		.setCustomId("back")
		.setLabel("Back")
		.setStyle(ButtonStyle.Secondary);

const buttons = {
	back: backButton,
	...giveaway.buttons,
	...myGiveaway.buttons
} as const;

const modals = {
	...giveaway.modals
} as const;

const components = {
	buttons,
	modals
} as const;

export default components;
