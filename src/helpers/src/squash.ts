import { createTag } from "common-tags";

/**
 * Squashes all adjacent newlines into a single newline.
 *
 * @example
 * const string = `this
 * multi-line string has
 *
 *
 *
 * a big hole`
 *
 * const squashed = squash(string);
 * // `this
 * // multi-line string has
 * //
 * // a big hole`
 *
 * const alsoSquashed = squash`${squashed}`;
 */
export const squash = createTag({
	onEndResult: (string) => string.replaceAll(/^\s*\n\s*$/gm, ""),
});
