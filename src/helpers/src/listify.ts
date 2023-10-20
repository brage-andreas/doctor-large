const DEFAULT_GIVE = 1;
const MIN_LENGTH = 1;
const MIN_GIVE = 0;

/**
 * @param options.give - How much lenience to give the length of the list. Default: `1`. Minimum: `0`.
 * @param options.length - The desired length of the list. Minimum: `1`.
 * @example
 * listify(["a", "b", "c"], { length: 2 }); // "a, b, and c" (give=1 by default)
 *
 * listify(["a", "b", "c"], { give: 0, length: 2 }); // "a, b, and 1 more"
 * listify(["a", "b", "c"], { give: 0, length: 1 }); // "a, and 2 more"
 *
 * listify([], { length: 1 }); // ""
 * listify(["a", "b", "c"], { length: 1 }); // "a, and 2 more"
 * listify(["a", "b", "c"], { length: 2 }); // "a, b, and c"
 * listify(["a", "b", "c"], { length: 3 }); // "a, b, and c"
 * listify(["a", "b", "c"], { length: 4 }); // "a, b, and c"
 */
export const listify = (elements: Array<string>, options: { give?: number; length: number }): string => {
	const give = Math.max(options.give ?? DEFAULT_GIVE, MIN_GIVE);
	const length = Math.max(options.length, MIN_LENGTH);

	const elements_ = structuredClone(elements);

	if (elements_.length === 0 || elements_.length === 1) {
		return elements_.join("");
	}

	if (length + give < elements_.length) {
		elements_.splice(length);
		elements_.push(`and ${elements.length - length} more`);

		return elements_.join(", ");
	}

	if (elements_.length === 2) {
		return `${elements_[0]} and ${elements_[1]}`;
	}

	const lastElement = elements_.splice(-1, 1)[0];

	return `${elements_.join(", ")}, and ${lastElement}`;
};
