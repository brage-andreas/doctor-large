import { createTag } from "common-tags";

const onEndResult = (string: string) => {
	const multilineWhitespace = new RegExp(/^\s*\n\s*$/, "gm");

	return string.replaceAll(multilineWhitespace, "");
};

/**
 * Trims multi-line whitespace.
 *
 * @example
 * `this has
 *
 *
 *
 * a big hole`
 *
 * // Becomes:
 * `this has
 *
 * a big hole`
 */
const trim = createTag({ onEndResult });

export default trim;
