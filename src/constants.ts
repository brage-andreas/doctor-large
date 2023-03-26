import { type Color } from "#typings";
import { oneLine } from "common-tags";
import {
	ActivityType,
	ApplicationCommandOptionType,
	formatEmoji,
	GatewayIntentBits,
	type ActivitiesOptions,
	type APIApplicationCommandBasicOption
} from "discord.js";

export const ACTIVITIES: Array<ActivitiesOptions> = [
	{ type: ActivityType.Listening, name: "Justin Bieber" },
	{ type: ActivityType.Watching, name: "27 Sep 2022" },
	{ type: ActivityType.Watching, name: "Boss Baby 2" },
	{ type: ActivityType.Watching, name: "Fatmagic lose again" },
	{ type: ActivityType.Watching, name: "grapes ferment" },
	{ type: ActivityType.Watching, name: "QUANTUM GAMING" },
	{ type: ActivityType.Playing, name: "as melee sniper" },
	{ type: ActivityType.Playing, name: "bowling!" },
	{ type: ActivityType.Playing, name: "Enlargening®️ 2023™️" },
	{ type: ActivityType.Playing, name: "in the Bean Cave" },
	{ type: ActivityType.Playing, name: "in the Bean Cave" },
	{ type: ActivityType.Playing, name: "in the Bean Cave" },
	{ type: ActivityType.Playing, name: "in the Wine Cellar" },
	{ type: ActivityType.Playing, name: "in the Wine Cellar" },
	{ type: ActivityType.Playing, name: "in the Wine Cellar" }
];

export const COMMAND_DIR = new URL("./commands", import.meta.url);
export const EVENT_DIR = new URL("./events", import.meta.url);

export const RegExp = {
	AcceptPrizeCustomId: /^accept-prize-(?<id>\d+)$/,
	DashboardPrizeCustomId: /^dashboard-prize-(?<id>\d+)/,
	EnterGiveawayCustomId: /^enter-giveaway-(?<id>\d+)$/,
	Id: /^\d{17,19}$/,
	MessageURL:
		/(?:https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?<guildId>\d{17,19})\/(?<channelId>\d{17,19})\/(?<messageId>\d{17,19}))/
} as const;

// Using Discord's colours if possible
//    https://discord.com/branding
export const Colors = {
	EmbedInvisible: "#2b2d31",
	Green: "#57f287",
	Red: "#ed4245",
	Yellow: "#fee75c"
} as const;
export const ColorsHex = {
	EmbedInvisible: 0x2b2d31,
	Green: 0x57f287,
	Red: 0xed4245,
	Yellow: 0xfee75c
} as const;

export const Emojis = {
	Cry: "😢",
	Edit: "✍️",
	Ended: "🔸",
	EnterGiveaway: "🎁",
	Error: formatEmoji("1061984813650804799"),
	Grin: "😁",
	Halo: "😇",
	HeartBreak: "💔",
	Higher: "🔺",
	Lock: "🔒",
	Lower: "🔻",
	NoEntry: "⛔",
	Off: formatEmoji("1047914155929256026"),
	On: formatEmoji("1047914157409828934"),
	Pensive: "🥺",
	Shush: "🤫",
	Sleep: "😴",
	Sparks: "✨",
	StarEyes: "🤩",
	SweatSmile: "😅",
	Tada: "🎉",
	Think: "🤔",
	Unlock: "🔓",
	V: formatEmoji("1054081028962136104"),
	Warn: formatEmoji("1080833238823608520"),
	WIP: "🚧",
	X: formatEmoji("1054081030107185252")
} as const;

export const INTENTS = [
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.Guilds
] as const;

export const Giveaway = {
	// This will work badly if it is under a minute
	HostDMTimeBeforeEnd: 1_800_000, // 30 minutes
	MaxDescriptionLength: 200,
	MaxDescriptionLines: 20,
	MaxTitleLength: 50,
	ManWinnerQuantityLength: 2,
	MinimumEndDateBuffer: 600_000 // 10 minutes
} as const;

export const MY_GIVEAWAYS_MAX_PRIZES = 5;

export const Prize = {
	MaxQuantity: 10, //      MATCH THESE (10          )
	MaxQuantityLength: 2, // MATCH THESE ( ^ two chars)
	MaxAdditionalInfoLength: 70,
	MaxTitleLength: 30
} as const;

export const DEFAULT_LOGGER_PREFIX = "LOG" as const;
export const DEFAULT_LOGGER_COLOR = "yellow" as Color;
export const MAX_LOGGER_PREFIX_PAD = 5 as const;

export const WIP_WARNING = oneLine`
	> ${Emojis.WIP} This command is work-in-progress and might experience issues.
`;

/**
 * Name: hide
 */
export const HIDE_OPTION: APIApplicationCommandBasicOption = {
	description: "Hide this command. (True)",
	name: "hide",
	type: ApplicationCommandOptionType.Boolean
};

export const MAX_REPORT_COMMENT_LENGTH = 1024;
