/**
 * Example strings:
 * * `11 Jan     2021 18:30:01 UTC+1`
 * * `11 January 2021 18:30:01 UTC+01`
 * * `11 Jan     2021 18:30    UTC+0100`
 */
export default function stringToDate(string: string) {
	const ms = Date.parse(string);

	return Number.isNaN(ms) ? null : ms;
}
