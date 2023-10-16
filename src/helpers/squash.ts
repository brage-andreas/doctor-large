import { createTag } from "common-tags";

/**
 * Squashes duplicate newlines into a single newline.
 *
 * @example
 * `this multi-line string has
 *
 *
 *
 * a big hole`
 *
 * // Becomes:
 * `this multi-line string has
 *
 * a big hole`
 */
const squash = createTag({
	onEndResult: (string) => string.replaceAll(/^\s*\n\s*$/gm, ""),
});

export default squash;
