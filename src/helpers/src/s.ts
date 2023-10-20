/**
 * @example
 * s("day", 1); // "day
 * s("day", 2); // "days"
 * s(["entry", "entries"], 1); // "entry"
 * s(["entry", "entries"], 2); // "entries"
 */
export const s = (string: [string, string] | string, number: number) => {
	if (typeof string === "string") {
		return `${string}${number === 1 ? "" : "s"}`;
	}

	return number === 1 ? string[0] : string[1];
};
