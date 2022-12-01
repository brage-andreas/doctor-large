import { type TimestampStylesString } from "discord.js";

export const timestamp = (
	discordTimestamp: number | string,
	timestampStyle: TimestampStylesString
) => `<t:${discordTimestamp}:${timestampStyle}>`;

export const longStamp = (discordTimestamp: number | string) =>
	`<t:${discordTimestamp}:d> (<t:${discordTimestamp}:R>)`;
