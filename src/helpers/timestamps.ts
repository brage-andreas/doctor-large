import { type TimestampStylesString } from "discord.js";

export const timestamp = (
	discordTimestamp: number | string,
	timestampStyle: TimestampStylesString
) => {
	const timestamp = Math.floor(Number(discordTimestamp) / 1000);

	return `<t:${timestamp}:${timestampStyle}>`;
};

export const longStamp = (discordTimestamp: number | string) => {
	const timestamp = Math.floor(Number(discordTimestamp) / 1000);

	return `<t:${timestamp}:d> (<t:${timestamp}:R>)`;
};
