import { GatewayIntentBits } from "discord.js";
import { type Color } from "./typings/index.js";

export const COMMAND_DIR = new URL("./commands", import.meta.url);
export const EVENT_DIR = new URL("./events", import.meta.url);

export const REGEXP = {
	DASHBOARD_PRIZE_CUSTOM_ID: /^dashboard-prize-(?<id>\d+)/,
	ENTER_GIVEAWAY_CUSTOM_ID: /^enter-giveaway-(?<id>\d+)$/,
	ACCEPT_PRIZE_CUSTOM_ID: /^accept-prize-(?<id>\d+)$/,
	ID: /^\d{17,19}$/
};

// using discord's colours if possible
// <https://discord.com/branding>
export const COLORS = {
	YELLOW: "#FEE75C",
	GREEN: "#57F287",
	RED: "#ED4245"
} as const;

export const EMOJIS = {
	ENTER_GIVEAWAY_EMOJI: "🎁",
	HEART_BREAK: "💔",
	SWEAT_SMILE: "😅",
	STAR_EYES: "🤩",
	NO_ENTRY: "⛔",
	PENSIVE: "🥺",
	HIGHER: "🔺",
	SPARKS: "✨",
	UNLOCK: "🔓",
	ENDED: "🔸",
	ERROR: "<:Error:1061984813650804799>",
	LOWER: "🔻",
	SHUSH: "🤫",
	SLEEP: "😴",
	THINK: "🤔",
	EDIT: "✍️",
	GRIN: "😁",
	HALO: "😇",
	LOCK: "🔒",
	TADA: "🎉",
	WARN: "<:Warning:1061984815781531729>",
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

export const PRIZE = {
	MAX_QUANTITY: 10, // -- MATCH THESE
	MAX_QUANTITY_LEN: 2, // MATCH THESE
	MAX_ADDITIONAL_INFO_LEN: 70,
	MAX_TITLE_LEN: 30
} as const;

export const DEFAULT_LOGGER_PREFIX = "LOG" as const;
export const DEFAULT_LOGGER_COLOR = "yellow" as Color;
