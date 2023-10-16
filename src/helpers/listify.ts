/**
 * @param options.give - How much lenience to give the length of the list. Default: `1`
 * @param options.length - The desired length of the list.
 */
export default function listify(elements: Array<string>, options: { give?: number; length: number }) {
	const { give, length } = options;
	const elements_ = structuredClone(elements);

	if (elements_.length === 0 || elements_.length === 1) {
		return elements_.join("");
	}

	if (length + (give ?? 1) < elements_.length) {
		elements_.splice(length);
		elements_.push(`and ${elements.length - length} more`);

		return elements_.join(", ");
	}

	if (elements_.length === 2) {
		return `${elements_[0]} and ${elements_[1]}`;
	}

	const lastElement = elements_.splice(-1, 1)[0];

	return `${elements_.join(", ")}, and ${lastElement}`;
}
