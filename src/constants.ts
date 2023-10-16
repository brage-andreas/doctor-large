import {
	type APIApplicationCommandBasicOption,
	type ActivitiesOptions,
	ActivityType,
	ApplicationCommandOptionType,
	GatewayIntentBits,
	formatEmoji,
} from "discord.js";
import { oneLineTrim } from "common-tags";
import { type Color } from "#typings";

const FlatRegex = {
	/**
	 * `^accept-prize-(?<id>\d+)$`
	 */
	AcceptPrizeCustomId: /^accept-prize-(?<id>\d+)$/,
	/**
	 * `^attach-report-(?<id>\d+)-to-latest-case$`
	 */
	AttachReportToLatestCase: /^attach-report-(?<id>\d+)-to-latest-case$/,
	/**
	 * `^dashboard-prize-(?<id>\d+)$`
	 */
	DashboardPrizeCustomId: /^dashboard-prize-(?<id>\d+)$/,
	/**
	 * `[\w-]{24}\.[\w-]{6}\.[\w-]{27}`
	 */
	DiscordApplicationToken: /[\w-]{24}\.[\w-]{6}\.[\w-]{27}/,
	/**
	 * `^enter-giveaway-(?<id>\d+)$`
	 */
	EnterGiveawayCustomId: /^enter-giveaway-(?<id>\d+)$/,
	/**
	 * `^mark-report-(?<id>\d+)-processed$`
	 */
	MarkReportProcessed: /^mark-report-(?<id>\d+)-processed$/,
	/**
	 * `^mark-report-(?<id>\d+)-unprocessed$`
	 */
	MarkReportUnprocessed: /^mark-report-(?<id>\d+)-unprocessed$/,
	/**
	 * `\d{17,19}`
	 */
	Snowflake: /\d{17,19}/,
	/**
	 * `^unattach-report-(?<id>\d+)-from-cases$`
	 */
	UnattachReportFromCases: /^unattach-report-(?<id>\d+)-from-cases$/,
} as const;

const getFlat = (regex: keyof typeof FlatRegex) => FlatRegex[regex].source;

const DynamicRegex = {
	/**
	 * `<(?<animated>a?):(?<name>\w+):(?<id>{Snowflake})>`
	 */
	Emoji: new RegExp(`<(?<animated>a?):(?<name>\\w+):(?<id>${getFlat("Snowflake")})>`),
	/**
	 * `^member-info-(?<id>{Snowflake})-(?<prefix>.+)$`
	 */
	MemberInfoCustomId: new RegExp(`^member-info-(?<id>${getFlat("Snowflake")})-(?<prefix>.+)$`),
	/**
	 * `https?:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/channels\/(?<guildId>{Snowflake})\/(?<channelId>{Snowflake})\/(?<messageId>{Snowflake})`
	 */
	MessageURL: new RegExp(
		oneLineTrim`
			https?:\\/\\/(?:ptb\\.|canary\\.)?discord(?:app)?\\.com\\/channels\\/
			(?<guildId>${getFlat("Snowflake")})\\/
			(?<channelId>${getFlat("Snowflake")})\\/
			(?<messageId>${getFlat("Snowflake")})
		`
	),
	/**
	 * `/preview-message-(?<channelId>{Snowflake})-(?<messageId>{Snowflake})/`
	 */
	PreviewMessage: new RegExp(
		oneLineTrim`
			^preview-message-
			(?<channelId>${getFlat("Snowflake")})-
			(?<messageId>${getFlat("Snowflake")})$
		`
	),
} as const;

export const Regex = {
	...FlatRegex,
	...DynamicRegex,
} as const;

export const ACTIVITIES: Array<ActivitiesOptions> = [
	{ name: "Rocket Jump Waltz (12 hours)", type: ActivityType.Listening },
	{ name: "Team Fortress 2", type: ActivityType.Playing },
	{ name: "BEST FREE INTROS 2012", type: ActivityType.Watching },
	{ name: "Boss Baby 2", type: ActivityType.Watching },
	{ name: "large", state: "bowling", type: ActivityType.Custom },
	{ name: "large", state: "melee sniper", type: ActivityType.Custom },
	{ name: "large", state: "grapes will ferment", type: ActivityType.Custom },
	{ name: "large", state: "hey waltuh - YouTube", type: ActivityType.Custom },
	{
		name: "large",
		state: "waiting for heavy update",
		type: ActivityType.Custom,
	},
	{
		name: "large",
		state: "How to escape a basement - YouTube",
		type: ActivityType.Custom,
	},
	{ name: "large", state: "QUANTUM GAMING", type: ActivityType.Custom },
	{
		name: "large",
		state: "[TF2] Top 10 Medic Tips - YouTube",
		type: ActivityType.Custom,
	},
	{
		name: "large",
		state: "How to play Sniper [TF2] - YouTube",
		type: ActivityType.Custom,
	},
	{
		name: "large",
		state: "TF2 SEAL GAMING - YouTube",
		type: ActivityType.Custom,
	},
];

export const COMMAND_DIR = new URL("commands", import.meta.url);
export const EVENT_DIR = new URL("events", import.meta.url);

// Using Discord's colours if possible
//    https://discord.com/branding
export const Colors = {
	EmbedInvisible: "#2b2d31",
	Green: "#57f287",
	Red: "#ed4245",
	Yellow: "#fee75c",
} as const;
export const ColorsHex = {
	EmbedInvisible: 0x2b_2d_31,
	Green: 0x57_f2_87,
	Red: 0xed_42_45,
	Yellow: 0xfe_e7_5c,
} as const;

export const Emojis = {
	Check: formatEmoji("1054081028962136104"),
	Cross: formatEmoji("1054081030107185252"),
	Cry: "😢",
	Edit: "✍️",
	Ended: "🔸",
	EnterGiveaway: "🎁",
	Error: formatEmoji("1061984813650804799"),
	FaceInClouds: "😶‍🌫️",
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
	WIP: "🚧",
	Warn: formatEmoji("1080833238823608520"),
} as const;

export const INTENTS = [
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.Guilds,
] as const;

export const Giveaway = {
	// This will work badly if it is under a minute
	HostDMTimeBeforeEnd: 1_800_000, // 30 minutes
	ManWinnerQuantityLength: 2,
	MaxDescriptionLength: 200,
	MaxDescriptionLines: 20,
	MaxTitleLength: 50,
	MinimumEndDateBuffer: 600_000, // 10 minutes
} as const;

export const MY_GIVEAWAYS_MAX_PRIZES = 5;

export const Prize = {
	MaxAdditionalInfoLength: 70,
	MaxQuantity: 10, //      MATCH THESE (10          )
	MaxQuantityLength: 2, // MATCH THESE ( ^ two chars)
	MaxTitleLength: 30,
} as const;

export const DEFAULT_LOGGER_PREFIX = "LOG" as const;
export const DEFAULT_LOGGER_COLOR = "yellow" as Color;

/**
 * Name: hide
 */
export const HIDE_OPTION: APIApplicationCommandBasicOption = {
	description: "Hide this command. (True)",
	name: "hide",
	type: ApplicationCommandOptionType.Boolean,
};

export const MAX_REPORT_COMMENT_LENGTH = 1024;
