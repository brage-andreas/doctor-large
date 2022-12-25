import { GatewayIntentBits } from "discord.js";
import { type Color } from "./typings/index.js";

export const COMMAND_DIR = new URL("./commands", import.meta.url);
export const EVENT_DIR = new URL("./events", import.meta.url);

export const REGEXP = {
	ENTER_GIVEAWAY_CUSTOM_ID: /^enter-giveaway-(?<id>\d+)$/,
	ACCEPT_PRIZE_CUSTOM_ID: /^accept-prize-(?<id>\d+)$/,
	ID: /^\d{17,19}$/
};

export const EMOJIS = {
	OFF: "<:OFF:1047914155929256026>",
	ON: "<:ON:1047914157409828934>",
	V: "<:YES:1054081028962136104>",
	X: "<:NO:1054081030107185252>"
} as const;

export const INTENTS: Array<GatewayIntentBits> = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages
];

export const GIVEAWAY = {
	MAX_TITLE_LEN: 50,
	MAX_DESCRIPTION_LEN: 200,
	MAX_DESCRIPTION_LINES: 20,
	MAX_WINNER_QUANTITY_LEN: 2
} as const;

export const DEFAULT_LOGGER_PREFIX = "LOG";
export const DEFAULT_LOGGER_COLOR: Color = "yellow";
