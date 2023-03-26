import { time } from "discord.js";

const seconds = (dateOrTimestamp: Date | number | string) => {
	const ms =
		typeof dateOrTimestamp === "object"
			? dateOrTimestamp.getTime()
			: Number(dateOrTimestamp) || 0;

	return Math.floor(ms / 1000);
};

// Default
export function longstamp(
	dateOrTimestamp: Date | number | string,
	options?: { extraLong?: undefined; reverse?: undefined }
): `<t:${number}:${"d"}> (<t:${number}:R>)`;

// Extra long
export function longstamp(
	dateOrTimestamp: Date | number | string,
	options: { extraLong: true }
): `<t:${number}:${"F"}> (<t:${number}:R>)`;

// Reverse
export function longstamp(
	dateOrTimestamp: Date | number | string,
	options: { reverse: true }
): `<t:${number}:R> (<t:${number}:${"d"}>)`;

// Extra long + reverse
export function longstamp(
	dateOrTimestamp: Date | number | string,
	options: { extraLong: true; reverse: true }
): `<t:${number}:R> (<t:${number}:${"F"}>)`;

export function longstamp(
	dateOrTimestamp: Date | number | string,
	options?: { extraLong?: true; reverse?: true }
):
	| `<t:${number}:${"d" | "F"}> (<t:${number}:R>)`
	| `<t:${number}:R> (<t:${number}:${"d" | "F"}>)` {
	const style = options?.extraLong ? "F" : "d";

	const main = time(seconds(dateOrTimestamp), style);
	const rel = time(seconds(dateOrTimestamp), "R");

	if (options?.reverse) {
		return `${rel} (${main})` as const;
	}

	return `${main} (${rel})` as const;
}
