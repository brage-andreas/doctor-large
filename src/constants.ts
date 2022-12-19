import { GatewayIntentBits } from "discord.js";
import { type Color } from "./typings/index.js";

export const COMMAND_DIR = new URL("./commands", import.meta.url);
export const EVENT_DIR = new URL("./events", import.meta.url);

export const REGEXP = {
	ID: /^\d{17,19}$/,
	GIVEAWAY_ENTRY_BUTTON_CUSTOM_ID: /^enter-giveaway-(?<id>\d+)$/
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

export const DEFAULT_LOGGER_PREFIX = "LOG";
export const DEFAULT_LOGGER_COLOR: Color = "yellow";
