import { oneLine } from "common-tags";
import { type Guild, type Interaction } from "discord.js";
import { DEFAULT_LOGGER_COLOR, DEFAULT_LOGGER_PREFIX } from "../constants.js";
import { type Color } from "../typings/index.js";
import { getColorFn, grey } from "./color.js";

function formatType(type: string): string {
	return type.toUpperCase().padStart(3, " ");
}

export default class Logger {
	public interaction?: Interaction<"cached">;
	public guild?: Guild;
	public prefix: string;
	public color: Color;

	public constructor(options?: {
		interaction?: Interaction<"cached"> | undefined;
		guild?: Guild | undefined;
		prefix?: string | undefined;
		color?: Color | undefined;
	}) {
		this.prefix = options?.prefix
			? formatType(options.prefix)
			: DEFAULT_LOGGER_PREFIX;

		this.color = options?.color ?? DEFAULT_LOGGER_COLOR;

		this.interaction = options?.interaction;
		this.guild = options?.guild ?? options?.interaction?.guild;
	}

	public setInteraction(interaction: Interaction<"cached">) {
		this.interaction = interaction;

		if (!this.guild) {
			this.guild = interaction.guild;
		}

		return this;
	}

	public setGuild(guild: Guild) {
		this.guild = guild;

		return this;
	}

	public setPrefix(prefix: string) {
		this.prefix = formatType(prefix);

		return this;
	}

	public setColor(color: Color) {
		this.color = color;

		return this;
	}

	public log(...messages: Array<unknown>) {
		if (this.interaction) {
			return this._logInteraction(...messages);
		}

		const toLog: Array<unknown> = [];

		if (this.guild) {
			const { name, id } = this.guild;
			const guildString = `${grey("Guild:")} ${name} ${grey(`(${id})`)}`;

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

		const greyLine = (
			obj: { name: string; id: string } | { tag: string; id: string },
			key: string,
			includePipe: boolean
		) => {
			const pipe = includePipe ? grey("| ") : "";
			const key_ = grey(`${key}:`);
			const name = "name" in obj ? obj.name : obj.tag;
			const id = grey(`(${obj.id})`);

			return `${pipe}${key_} ${name} ${id}`;
		};

		const channelString = channel
			? ` ${greyLine(channel, "Channel", true)}`
			: "";

		const cmdSource = oneLine`
			${greyLine(user, "User", false)}${channelString}
			${greyLine(guild, "Guild", true)}
		`;

		const cmdString =
			this.interaction.isChatInputCommand() &&
			grey(`>> ${this.interaction.toString()}`);

		const cmdArray = [cmdSource];

		if (cmdString) {
			cmdArray.push(cmdString);
		}

		this._log(...cmdArray, ...messages);
	}

	private _log(...items: Array<unknown>) {
		const date = new Date().toLocaleString("en-GB", {
			dateStyle: "medium",
			timeStyle: "long"
		});

		const prefix = "::".padStart(this.prefix.length, " ");
		const colorFn = getColorFn(this.color);

		console.log(`${colorFn(this.prefix)} ${grey(date)}`);

		const string = items
			.map((item) => {
				let logMsg: string;

				const notNull = item !== null;
				const isObj = typeof item === "object";
				const isFn = typeof item === "function";

				if (isObj && notNull && "stack" in item) {
					logMsg = String(item.stack);
				} else if (!isObj && !isFn) {
					logMsg = String(item);
				} else {
					logMsg = JSON.stringify(item, (_, value) =>
						typeof value === "bigint" ? value.toString() : value
					);
				}

				return logMsg
					.split("\n")
					.map((line) => `${grey(prefix)} ${line}`)
					.join("\n");
			})
			.join("\n");

		console.log(string, "\n");
	}
}
