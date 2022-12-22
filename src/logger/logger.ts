import { oneLine } from "common-tags";
import { type Interaction } from "discord.js";
import { DEFAULT_LOGGER_COLOR, DEFAULT_LOGGER_PREFIX } from "../constants.js";
import { type Color } from "../typings/index.js";
import { getColorFn, grey } from "./color.js";

const formatType = (type: string | undefined) =>
	type?.toUpperCase().padStart(3, " ");

export default class Logger {
	public interaction?: Interaction<"cached">;
	public prefix: string;
	public color: Color;

	public constructor(options?: {
		interaction?: Interaction<"cached"> | undefined;
		prefix?: string | undefined;
		color?: Color | undefined;
	}) {
		this.prefix = formatType(options?.prefix) ?? DEFAULT_LOGGER_PREFIX;

		this.color = options?.color ?? DEFAULT_LOGGER_COLOR;

		this.interaction = options?.interaction;
	}

	public setInteraction(interaction: Interaction<"cached">) {
		this.interaction = interaction;

		return this;
	}

	public setPrefix(type: string) {
		this.prefix = type;

		return this;
	}

	public setColor(color: Color) {
		this.color = color;

		return this;
	}

	public log(...messages: Array<string>) {
		if (this.interaction) {
			this.logInteraction(...messages);

			return;
		}

		const date = new Date().toLocaleString("en-GB");

		const prefix = "::".padStart(this.prefix.length, " ");
		const colorFn = getColorFn(this.color);

		console.log(`${colorFn(this.prefix)} ${grey(date)}`);

		messages.forEach((message) => {
			console.log(`${grey(prefix)} ${message}`);
		});

		console.log();
	}

	private logInteraction(...messages: Array<string>) {
		if (!this.interaction) {
			throw new Error("Interaction not set to logger");
		}

		const { guild, channel, user } = this.interaction;

		const channelString = channel
			? `${grey("| Channel:")} ${channel.name} ${grey(`(${channel.id})`)}`
			: "";

		const cmdSource = oneLine`
			${grey("User:")} ${user.tag} ${grey(`(${user.id})`)}
			${channelString}
			${grey("| Guild:")} ${guild.name} ${grey(`(${guild.id})`)}
		`;

		const cmdString =
			this.interaction.isChatInputCommand() &&
			grey(`>> ${this.interaction.toString()}`);

		const cmdArray = [cmdSource];

		if (cmdString) {
			cmdArray.push(cmdString);
		}

		this.log(...cmdArray, ...messages);
	}
}
