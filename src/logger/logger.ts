import { DEFAULT_LOGGER_COLOR, DEFAULT_LOGGER_PREFIX } from "#constants";
import { type Color } from "#typings";
import {
	type ContextMenuCommandInteraction,
	type Guild,
	type Interaction
} from "discord.js";
import console from "node:console";
import { getColorFn, grey } from "./color.js";

const formatType = (type: string) => type.toUpperCase().padStart(3, " ");

const bigintReplacer = (_: unknown, value: unknown) =>
	typeof value === "bigint" ? value.toString() : value;

type AnyInteraction =
	| ContextMenuCommandInteraction<"cached">
	| Interaction<"cached">;

export default class Logger {
	public color: Color = DEFAULT_LOGGER_COLOR;
	public guild?: Guild;
	public interaction?: AnyInteraction;
	public prefix: string = DEFAULT_LOGGER_PREFIX;

	public constructor(options?: {
		color?: Color;
		guild?: Guild;
		interaction?: AnyInteraction;
		prefix?: string;
	}) {
		if (options) {
			this.setOptions(options);
		}
	}

	public setOptions(options: {
		color?: Color | undefined;
		guild?: Guild | undefined;
		interaction?:
			| ContextMenuCommandInteraction<"cached">
			| Interaction<"cached">
			| undefined;
		prefix?: string | undefined;
	}) {
		if (options.color) {
			this.color = options.color;
		}

		if (options.guild || options.interaction?.guild) {
			this.guild = options.guild ?? options.interaction?.guild;
		}

		if (options.interaction) {
			this.interaction = options.interaction;
		}

		if (options.prefix) {
			this.prefix = formatType(options.prefix);
		}

		return this;
	}

	public log(...messages: Array<unknown>) {
		if (this.interaction) {
			return this._logInteraction(...messages);
		}

		const toLog: Array<unknown> = [];

		if (this.guild) {
			const { name, id } = this.guild;
			const guildString = `${grey`Guild:`} ${name} ${grey`(${id})`}`;

			toLog.push(guildString);
		}

		toLog.push(...messages);

		this._log(...toLog);
	}

	private _logInteraction(...messages: Array<unknown>) {
		if (!this.interaction) {
			throw new Error("`this.interaction` is not set");
		}

		const { channel, guild: interactionGuild, user } = this.interaction;
		const guild = this.guild ?? interactionGuild;

		const prefixArr = [`${grey`User:`} ${user.tag} ${grey(user.id)}`];

		if (channel) {
			prefixArr.push(
				`${grey`Channel:`} #${channel.name} ${grey`(${channel.id})`}`
			);
		}

		prefixArr.push(`${grey`Guild:`} ${guild.name} ${grey`(${guild.id})`}`);

		const toLog = [prefixArr.join(grey` | `)];

		const commandString =
			this.interaction.isChatInputCommand() &&
			grey`>> ${this.interaction}`;

		if (commandString) {
			toLog.push(commandString);
		}

		this._log(...toLog, ...messages);
	}

	private _log(...itemsToLog: Array<unknown>) {
		const date = new Date().toLocaleString("en-GB", {
			dateStyle: "long",
			hourCycle: "h23",
			timeStyle: "long",
			timeZone: "UTC"
		});

		const prefix = grey("::".padStart(this.prefix.length, " "));
		const color = getColorFn(this.color);

		console.log(`${color(this.prefix)} ${grey(date)}`);

		for (const item of itemsToLog) {
			const isFunction = typeof item === "function";
			const isObject = typeof item === "object";
			const isError = item instanceof Error;

			let string: string;

			if (isError) {
				string = item.stack ?? `${item.name}: ${item.message}`;
			} else if (isObject || isFunction) {
				string = JSON.stringify(item, bigintReplacer);
			} else {
				string = String(item);
			}

			for (const line of string.split("\n")) {
				console.log(`${prefix} ${line}`);
			}
		}

		// For newline
		console.log();
	}
}
