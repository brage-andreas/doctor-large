import { type Color } from "#typings";

const ansiColors = {
	black: "\x1b[30m",
	blue: "\x1b[94m",
	green: "\x1b[92m",
	grey: "\x1b[90m",
	none: "\x1b[0m",
	red: "\x1b[91m",
	white: "\x1b[97m",
	yellow: "\x1b[93m"
} as const;

export const color = <T extends string, C extends Color>(
	text: T,
	color: C
): `${(typeof ansiColors)[C]}${T}${(typeof ansiColors)["none"]}` =>
	`${ansiColors[color]}${text}${ansiColors.none}`;

export const black = <T extends string>(text: T) => color(text, "black");
export const blue = <T extends string>(text: T) => color(text, "blue");
export const green = <T extends string>(text: T) => color(text, "green");
export const grey = <T extends string>(text: T) => color(text, "grey");
export const red = <T extends string>(text: T) => color(text, "red");
export const white = <T extends string>(text: T) => color(text, "white");
export const yellow = <T extends string>(text: T) => color(text, "yellow");

export const getColorFn = (color: Color) => {
	switch (color) {
		case "black": {
			return black;
		}

		case "blue": {
			return blue;
		}

		case "green": {
			return green;
		}

		case "grey": {
			return grey;
		}

		case "red": {
			return red;
		}

		case "white": {
			return white;
		}

		case "yellow": {
			return yellow;
		}

		default: {
			return yellow;
		}
	}
};
