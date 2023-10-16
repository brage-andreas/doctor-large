import { type Color } from "#typings";

const ansiColors = {
	black: "\u001B[30m",
	blue: "\u001B[94m",
	green: "\u001B[92m",
	grey: "\u001B[90m",
	none: "\u001B[0m",
	red: "\u001B[91m",
	white: "\u001B[97m",
	yellow: "\u001B[93m",
} as const;

export const color = <T extends string, C extends Color>(
	text: T,
	color: C
): `${(typeof ansiColors)[C]}${T}${(typeof ansiColors)["none"]}` => `${ansiColors[color]}${text}${ansiColors.none}`;

export const black = <T extends string>(text: T) => color(text, "black");
export const blue = <T extends string>(text: T) => color(text, "blue");
export const green = <T extends string>(text: T) => color(text, "green");
export const grey = <T extends string>(text: T) => color(text, "grey");
export const red = <T extends string>(text: T) => color(text, "red");
export const white = <T extends string>(text: T) => color(text, "white");
export const yellow = <T extends string>(text: T) => color(text, "yellow");

export const getColorFunction = (color: Color) => {
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
