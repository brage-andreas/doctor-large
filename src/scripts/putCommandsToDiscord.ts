import { type RESTPostAPIApplicationCommandsJSONBody, Routes } from "discord.js";
import commands from "./loadCommands.js";
import { REST } from "@discordjs/rest";
import { Regex } from "#constants";
import console from "node:console";
import process from "node:process";

function getCommandData() {
	const rawCommandData = [...new Set(commands.values())];

	return rawCommandData.flatMap(({ data }) =>
		[data.chatInput, data.contextMenu, data.messageContextMenu, data.userContextMenu].filter(Boolean)
	) as Array<RESTPostAPIApplicationCommandsJSONBody>;
}

export default async function putCommandsToDiscord(options?: { clear: boolean }) {
	if (!process.env.DISCORD_APPLICATION_ID) {
		throw new TypeError("'DISCORD_APPLICATION_ID' not defined in .env");
	}

	if (!process.env.DISCORD_APPLICATION_TOKEN) {
		throw new TypeError("'DISCORD_APPLICATION_TOKEN' is not defined in .env");
	}

	if (!Regex.DiscordApplicationToken.test(process.env.DISCORD_APPLICATION_TOKEN)) {
		throw new TypeError("'DISCORD_APPLICATION_TOKEN' defined in .env is faulty");
	}

	const { DISCORD_APPLICATION_ID: applicationId, DISCORD_APPLICATION_TOKEN: token, GUILD_ID: guildId } = process.env;

	if (!Regex.Snowflake.test(applicationId)) {
		throw new TypeError(`'DISCORD_APPLICATION_ID' defined in .env is faulty: ${applicationId}`);
	}

	if (guildId && !Regex.Snowflake.test(guildId)) {
		throw new TypeError(`'GUILD_ID' defined in .env is faulty: ${guildId}`);
	}

	const rest = new REST().setToken(token);

	const body = options?.clear ? [] : getCommandData();

	const route = guildId
		? Routes.applicationGuildCommands(applicationId, guildId)
		: Routes.applicationCommands(applicationId);

	await rest.put(route, { body });

	console.log(`Put ${body.length} commands ${guildId ? `in guild: ${guildId}` : "globally"}`);
}
