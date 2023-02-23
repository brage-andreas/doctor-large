import { REGEXP } from "#constants";
import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import getRawCommandData from "./getRawCommandData.js";

export default async function ({
	CLIENT_ID,
	GUILD_ID,
	CLEAR_COMMANDS = false
}: {
	CLIENT_ID: string;
	GUILD_ID?: string | null | undefined;
	CLEAR_COMMANDS?: boolean;
}) {
	if (!process.env.BOT_TOKEN) {
		throw new Error("BOT_TOKEN not defined in .env");
	}

	if (!REGEXP.ID.test(CLIENT_ID)) {
		throw new Error(`Client ID is faulty: ${CLIENT_ID}`);
	}

	if (GUILD_ID && !REGEXP.ID.test(GUILD_ID)) {
		throw new Error(`Guild ID is faulty: ${GUILD_ID}`);
	}

	const data = getRawCommandData();

	const rest = new REST().setToken(process.env.BOT_TOKEN);

	try {
		const route = GUILD_ID
			? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
			: Routes.applicationCommands(CLIENT_ID);

		const options = { body: CLEAR_COMMANDS ? [] : data };
		const clearMsg = CLEAR_COMMANDS ? "Cleared" : "Set";

		const logMsg = GUILD_ID
			? `${clearMsg} commands in guild: ${GUILD_ID}`
			: `${clearMsg} global commands`;

		await rest
			.put(route, options)
			.then(() => console.log(logMsg))
			.catch((err) => {
				console.log(err.stack ?? err.message);
			});
	} catch (err: unknown) {
		const error = err as Error;
		console.log(error.stack ?? error.message);
	}
}
