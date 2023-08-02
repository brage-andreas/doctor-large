export default function listify(
	elements: Array<string>,
	options: { length: number; give?: number }
) {
	const { length, give } = options;
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
