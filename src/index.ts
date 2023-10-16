import { ACTIVITIES, INTENTS, Regex } from "#constants";
import loadEvents from "#scripts/loadEvents.js";
import { Client } from "discord.js";
import process from "node:process";
import Logger from "#logger";

if (!process.env.DISCORD_APPLICATION_TOKEN) {
	throw new TypeError("'DISCORD_APPLICATION_TOKEN' is not defined in .env");
}

if (!Regex.DiscordApplicationToken.test(process.env.DISCORD_APPLICATION_TOKEN)) {
	throw new TypeError("'DISCORD_APPLICATION_TOKEN' defined in .env is faulty");
}

const client = new Client({
	allowedMentions: {
		parse: [],
		repliedUser: false,
	},
	intents: INTENTS,
	presence: {
		activities: [ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]],
	},
});

process.on("unhandledRejection", (error) => {
	new Logger({ color: "red", label: "ERROR" }).log(error);
});

await loadEvents(client);

void client.login(process.env.DISCORD_APPLICATION_TOKEN);
