import { type Color } from "#typings";
import createTag from "@drango/tag-functions";

const ansiColors: Record<string, string> = {
	black: "\x1b[30m",
	blue: "\x1b[94m",
	grey: "\x1b[90m",
	green: "\x1b[92m",
	none: "\x1b[0m",
	red: "\x1b[91m",
	white: "\x1b[97m",
	yellow: "\x1b[93m"
};

const wrap = (text: string, color: string) =>
	`${ansiColors[color]}${text}${ansiColors.none}`;

export const black = createTag((text: string) => wrap(text, "black"));
export const blue = createTag((text: string) => wrap(text, "blue"));
export const green = createTag((text: string) => wrap(text, "green"));
export const grey = createTag((text: string) => wrap(text, "grey"));
export const red = createTag((text: string) => wrap(text, "red"));
export const white = createTag((text: string) => wrap(text, "white"));
export const yellow = createTag((text: string) => wrap(text, "yellow"));

export const getColorFn = (color: Color) => {
	switch (color) {
		case "black":
			return black;

		case "blue":
			return blue;

		case "green":
			return green;

		case "grey":
			return grey;

		case "red":
			return red;

		case "white":
			return white;

		case "yellow":
			return yellow;
	}
};
