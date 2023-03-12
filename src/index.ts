import { ACTIVITIES, INTENTS } from "#constants";
import Logger from "#logger";
import loadEvents from "#scripts/loadEvents.js";
import { Client } from "discord.js";
import process from "node:process";

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
	new Logger({ prefix: "ERROR", color: "red" }).log(error);
});

await loadEvents(client);

client.login(process.env.BOT_TOKEN);
