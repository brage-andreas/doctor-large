import { RegExp } from "#constants";
import { REST } from "@discordjs/rest";
import {
	Routes,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import commands from "./loadCommands.js";

function getCommandData() {
	const rawCommandData = [...new Set(commands.values())];

	return rawCommandData.flatMap(({ data }) =>
		[data.chatInput, data.contextMenu].filter(Boolean)
	) as Array<RESTPostAPIApplicationCommandsJSONBody>;
}

export default async function putCommandsToDiscord(
	{ clear }: { clear: boolean } = { clear: false }
) {
	if (!process.env.BOT_TOKEN) {
		throw new Error("'BOT_TOKEN' option is not defined in .env");
	}

	if (!process.env.CLIENT_ID) {
		throw new Error("'CLIENT_ID' option not defined in .env");
	}

	const {
		BOT_TOKEN: token,
		CLIENT_ID: clientId,
		GUILD_ID: guildId
	} = process.env;

	if (!RegExp.Id.test(clientId)) {
		throw new Error(
			`'CLIENT_ID' option defined in .env is faulty: ${clientId}`
		);
	}

	if (guildId && !RegExp.Id.test(guildId)) {
		throw new Error(
			`'GUILD_ID' option defined in .env is faulty: ${guildId}`
		);
	}

	const commandData = !clear ? getCommandData() : [];

	const rest = new REST().setToken(token);

	const route = guildId
		? Routes.applicationGuildCommands(clientId, guildId)
		: Routes.applicationCommands(clientId);

	await rest
		.put(route, { body: commandData })
		.then(() => {
			const suffix = guildId ? `in guild: ${guildId}` : "globally";
			console.log(`Put ${commandData.length} commands ${suffix}`);
		})
		.catch(console.log);
}
