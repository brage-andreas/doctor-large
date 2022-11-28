import { Client } from "discord.js";
import "dotenv/config";
import { readdirSync } from "fs";
import { EVENT_DIR, INTENTS } from "./constants.js";
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

client.login(process.env.BOT_TOKEN);
