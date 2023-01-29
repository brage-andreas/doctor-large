import { type TimestampStylesString } from "discord.js";

const _getSeconds = (dateOrTimestamp: Date | number | string) => {
	let timestamp: number;

	if (dateOrTimestamp instanceof Date) {
		timestamp = dateOrTimestamp.getTime();
	} else {
		timestamp = Number(dateOrTimestamp) || 0;
	}

	return Math.floor(timestamp / 1000);
};

export const timestamp = (
	dateOrTimestamp: Date | number | string,
	style: TimestampStylesString
) => {
	const seconds = _getSeconds(dateOrTimestamp);

	return `<t:${seconds}:${style}>`;
};

export const longStamp = (
	dateOrTimestamp: Date | number | string,
	options?: { extraLong?: true }
) => {
	const seconds = _getSeconds(dateOrTimestamp);
	const style = options?.extraLong ? "F" : "d";

	return `<t:${seconds}:${style}> (<t:${seconds}:R>)`;
};
