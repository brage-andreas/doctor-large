import { type TimestampStylesString } from "discord.js";

const _getSeconds = (dateOrTimestamp: Date | number | string) => {
	let ms: number;

	if (dateOrTimestamp instanceof Date) {
		ms = dateOrTimestamp.getTime();
	} else {
		ms = Number(dateOrTimestamp) || 0;
	}

	return Math.floor(ms / 1000);
};

export const timestamp = (
	dateOrTimestamp: Date | number | string,
	style: TimestampStylesString
) => {
	const seconds = _getSeconds(dateOrTimestamp);

	return `<t:${seconds}:${style}>`;
};

export const longstamp = (
	dateOrTimestamp: Date | number | string,
	options?: { extraLong?: true; reverse?: true }
) => {
	const style = options?.extraLong ? "F" : "d";

	const main = timestamp(dateOrTimestamp, style);
	const rel = timestamp(dateOrTimestamp, "R");

	if (options?.reverse) {
		return `${rel} (${main})`;
	}

	return `${main} (${rel})`;
};
