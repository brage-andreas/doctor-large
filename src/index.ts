import { Client } from "discord.js";
import "dotenv/config";
import { existsSync, lstatSync, readdirSync } from "fs";
import process from "node:process";
import { EVENT_DIR, INTENTS } from "./constants.js";
import Logger from "./logger/logger.js";
import { type EventFn, type EventImport } from "./typings/index.js";

const client = new Client({
	intents: INTENTS,
	allowedMentions: {
		repliedUser: false,
		parse: []
	}
});

const events: Map<string, EventFn> = new Map();

for (const fileName of readdirSync(EVENT_DIR)) {
	const url = new URL(`./events/${fileName}`, import.meta.url);

	if (existsSync(url) && lstatSync(url).isDirectory()) {
		continue;
	}

	const event = (await import(`./events/${fileName}`)) as EventImport;
	const name = fileName.split(".")[0];

	events.set(name, event.run);
}

events.forEach((event, name) => {
	client.on(name, (...args: Array<unknown>) => {
		if (name === "ready") {
			event(client, ...args);
		} else {
			event(...args);
		}
	});
});

process.on("unhandledRejection", (error) => {
	new Logger({ prefix: "ERROR", color: "red" }).log(error);
});

client.login(process.env.BOT_TOKEN);
