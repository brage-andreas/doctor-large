import { ACTIVITIES, EVENT_DIR, INTENTS } from "#constants";
import Logger from "#logger";
import { type EventExport } from "#typings";
import { Client } from "discord.js";
import { existsSync, lstatSync, readdirSync } from "fs";
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

const isFolder = (url: URL) => existsSync(url) && lstatSync(url).isDirectory();
const events: Set<EventExport> = new Set();

for (const fileName of readdirSync(EVENT_DIR)) {
	const url = new URL(`./events/${fileName}`, import.meta.url);

	if (isFolder(url)) {
		continue;
	}

	const rawEventImport = await import(url.toString());

	if (typeof rawEventImport !== "object") {
		throw new Error(
			`File "./events/${fileName}" does not export an object`
		);
	}

	if (!("getEvent" in rawEventImport)) {
		throw new Error(
			`File "./events/${fileName}" does not contain property 'getEvent'`
		);
	}

	if (typeof rawEventImport.getEvent !== "function") {
		throw new Error(
			`File "./events/${fileName}" exported property 'getEvent' is not of type function`
		);
	}

	const rawEvent = rawEventImport.getEvent();

	if (typeof rawEvent !== "object") {
		throw new Error(
			`File "./events/${fileName} exported property 'getEvent' does not export an object`
		);
	}

	if (!("event" in rawEvent)) {
		throw new Error(
			`File "./events/${fileName} exported property 'getEvent' does not contain property 'event'`
		);
	}

	if (typeof rawEvent.event !== "string") {
		throw new Error(
			`File "./events/${fileName} exported property 'getEvent' property 'event' is not of type string `
		);
	}

	if (!("execute" in rawEvent)) {
		throw new Error(
			`File "./events/${fileName} exported property 'getEvent' does not contain property 'execute'`
		);
	}

	if (typeof rawEvent.execute !== "function") {
		throw new Error(
			`File "./events/${fileName} exported property 'getEvent' property 'execute' is not of type function`
		);
	}

	events.add(rawEvent as EventExport);
}

new Logger({ color: "grey", prefix: "EVENTS" }).log(
	`Loading ${events.size} events...`
);

events.forEach(({ event, execute }) => {
	client.on(event.toString(), (...args: Array<unknown>) => {
		if (event === "ready") {
			execute(client, ...args);
		} else {
			execute(...args);
		}
	});
});

process.on("unhandledRejection", (error) => {
	new Logger({ prefix: "ERROR", color: "red" }).log(error);
});

client.login(process.env.BOT_TOKEN);
