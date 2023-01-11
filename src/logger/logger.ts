import { oneLine } from "common-tags";
import { type Guild, type Interaction } from "discord.js";
import { DEFAULT_LOGGER_COLOR, DEFAULT_LOGGER_PREFIX } from "../constants.js";
import { type Color } from "../typings/index.js";
import { getColorFn, grey } from "./color.js";

const formatType = (type: string | undefined) =>
	type?.toUpperCase().padStart(3, " ");

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
		this.prefix = formatType(options?.prefix) ?? DEFAULT_LOGGER_PREFIX;

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
		this.prefix = prefix;

		return this;
	}

	public setColor(color: Color) {
		this.color = color;

		return this;
	}

	public log(...messages: Array<unknown>) {
		if (this.interaction) {
			this.logInteraction(...messages);
		} else {
			const toLog: Array<unknown> = [];

			if (this.guild) {
				const { name, id } = this.guild;
				const guildString = `${grey("Guild:")} ${name} ${grey(
					`(${id})`
				)}`;

				toLog.push(guildString);
			}

			toLog.push(...messages);

			this._log(...toLog);
		}
	}

	private logInteraction(...messages: Array<unknown>) {
		if (!this.interaction) {
			throw new Error("Interaction not set to logger");
		}

		const { channel, user } = this.interaction;
		const guild = this.guild ?? this.interaction.guild; // should never be default but just in case

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

		this._log(...cmdArray, ...messages);
	}

	// TODO: refactor
	private _log(...messages: Array<unknown>) {
		const date = new Date().toLocaleString("en-GB");

		const prefix = "::".padStart(this.prefix.length, " ");
		const colorFn = getColorFn(this.color);

		console.log(`${colorFn(this.prefix)} ${grey(date)}`);

		const string = messages
			.flatMap((message) => {
				let logMsg: string;

				if (
					typeof message === "object" &&
					message !== null &&
					"stack" in message
				) {
					logMsg = `${message.stack}`;
				} else {
					logMsg =
						typeof message === "string"
							? message
							: JSON.stringify(message, (_, value) =>
									typeof value === "bigint"
										? value.toString()
										: value
							  );
				}

				return logMsg
					.split("\n")
					.map((line) => `${grey(prefix)} ${line}`);
			})
			.join("\n");

		console.log(string, "\n");
	}
}
