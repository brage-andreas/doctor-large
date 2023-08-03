import { ACTIVITIES, INTENTS, Regex } from "#constants";
import Logger from "#logger";
import loadEvents from "#scripts/loadEvents.js";
import { Client } from "discord.js";
import process from "node:process";

if (!process.env.DISCORD_APPLICATION_TOKEN) {
	throw new TypeError("'DISCORD_APPLICATION_TOKEN' is not defined in .env");
}

if (
	!Regex.DiscordApplicationToken.test(process.env.DISCORD_APPLICATION_TOKEN)
) {
	throw new TypeError(
		"'DISCORD_APPLICATION_TOKEN' defined in .env is faulty"
	);
}

const client = new Client({
	intents: INTENTS,
	allowedMentions: {
		repliedUser: false,
		parse: []
	},
	presence: {
		activities: [ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]]
	}
});

process.on("unhandledRejection", (error) => {
	new Logger({ label: "ERROR", color: "red" }).log(error);
});

await loadEvents(client);

client.login(process.env.DISCORD_APPLICATION_TOKEN);
