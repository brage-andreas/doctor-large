import { time } from "discord.js";

const seconds = (dateOrTimestamp: Date | number | string) => {
	const ms = typeof dateOrTimestamp === "object" ? dateOrTimestamp.getTime() : Number(dateOrTimestamp) || 0;

	return Math.floor(ms / 1000);
};

// Default
export default function longstamp(
	dateOrTimestamp: Date | number | string,
	options?: { extraLong?: undefined; reverse?: undefined }
): `<t:${number}:${"d"}> (<t:${number}:R>)`;

// Extra long
export default function longstamp(
	dateOrTimestamp: Date | number | string,
	options: { extraLong: true }
): `<t:${number}:${"F"}> (<t:${number}:R>)`;

// Reverse
export default function longstamp(
	dateOrTimestamp: Date | number | string,
	options: { reverse: true }
): `<t:${number}:R> (<t:${number}:${"d"}>)`;

// Extra long + reverse
export default function longstamp(
	dateOrTimestamp: Date | number | string,
	options: { extraLong: true; reverse: true }
): `<t:${number}:R> (<t:${number}:${"F"}>)`;

export default function longstamp(
	dateOrTimestamp: Date | number | string,
	options?: { extraLong?: true; reverse?: true }
): `<t:${number}:${"F" | "d"}> (<t:${number}:R>)` | `<t:${number}:R> (<t:${number}:${"F" | "d"}>)` {
	const style = options?.extraLong ? "F" : "d";

	const main = time(seconds(dateOrTimestamp), style);
	const relative = time(seconds(dateOrTimestamp), "R");

	if (options?.reverse) {
		return `${relative} (${main})` as const;
	}

	return `${main} (${relative})` as const;
}
