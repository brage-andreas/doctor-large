import { GatewayIntentBits } from "discord.js";
import { type Color } from "./typings/index.js";

export const COMMAND_DIR = new URL("./commands", import.meta.url);
export const EVENT_DIR = new URL("./events", import.meta.url);

export const REGEXP = {
	ID: /^\d{17,19}$/,
	GIVEAWAY_ENTRY_BUTTON_CUSTOM_ID: /^enter-giveaway-(?<id>\d+)$/
};

export const EMOJIS = {
	X: "<:x:934561586419490876>",
	V: "<:v:934561586394333234>"
} as const;

export const INTENTS: Array<GatewayIntentBits> = [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages
];

export const DEFAULT_LOGGER_PREFIX = "LOG";
export const DEFAULT_LOGGER_COLOR: Color = "yellow";
