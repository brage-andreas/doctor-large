import { GatewayIntentBits } from "discord.js";

export const COMMAND_DIR = new URL("./commands", import.meta.url);
export const EVENT_DIR = new URL("./events", import.meta.url);

export const REGEXP = {
	ID: /^\d{17,19}$/
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
