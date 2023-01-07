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
	ENTER_GIVEAWAY_EMOJI: "🎁",
	HEART_BREAK: "💔",
	SWEAT_SMILE: "😅",
	STAR_EYES: "🤩",
	INACTIVE: "🔸",
	NO_ENTRY: "⛔",
	PENSIVE: "🥺",
	HIGHER: "🔺",
	SPARKS: "✨",
	UNLOCK: "🔓",
	LOWER: "🔻",
	SHUSH: "🤫",
	SLEEP: "😴",
	THINK: "🤔",
	EDIT: "✍️",
	GRIN: "😁",
	HALO: "😇",
	LOCK: "🔒",
	TADA: "🎉",
	WARN: "⚠️",
	CRY: "😢",
	OFF: "<:Off:1047914155929256026>",
	ON: "<:On:1047914157409828934>",
	V: "<:Checkmark:1054081028962136104>",
	X: "<:Xmark:1054081030107185252>"
} as const;

export const INTENTS: Array<GatewayIntentBits> = [
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.Guilds
];

export const GIVEAWAY = {
	MAX_WINNER_QUANTITY_LEN: 2,
	MAX_DESCRIPTION_LINES: 20,
	MAX_DESCRIPTION_LEN: 200,
	MAX_TITLE_LEN: 50
} as const;

export const DEFAULT_LOGGER_PREFIX = "LOG" as const;
export const DEFAULT_LOGGER_COLOR = "yellow" as Color;
