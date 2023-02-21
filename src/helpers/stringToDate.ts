import ms from "ms";

/**
 * Example strings:
 * * `11 Jan     2021 18:30:01 UTC+1`
 * * `11 January 2021 18:30:01 UTC+01`
 * * `11 Jan     2021 18:30    UTC+0100`
 * * `2 weeks`
 * * `1h`
 */
export default function stringToDate(string: string) {
	const dateParseResult = Date.parse(string);
	const msResult = ms(string);

	if (!Number.isNaN(dateParseResult)) {
		return dateParseResult;
	} else if (!Number.isNaN(msResult)) {
		return Date.now() + msResult;
	}

	return null;
}
