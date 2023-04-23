import { EVENT_DIR } from "#constants";
import { type EventExportData } from "#typings";
import { type Client } from "discord.js";
import console from "node:console";
import { readdirSync, statSync } from "node:fs";
import { grey } from "../logger/color.js";

const isFolder = (url: URL) =>
	statSync(url, { throwIfNoEntry: false })?.isDirectory();

export default async function loadEvents(client: Client) {
	const events: Set<EventExportData> = new Set();

	for (const fileName of readdirSync(EVENT_DIR)) {
		const url = new URL(`../events/${fileName}`, import.meta.url);

		if (isFolder(url) || !fileName.endsWith(".js")) {
			continue;
		}

		const err = (string: string) => {
			throw new TypeError(`File '/events/${fileName}' ${string}`);
		};

		const rawEventImport = await import(url.toString());

		if (typeof rawEventImport !== "object") {
			err("does not export an object");
		}

		if (!("getEvent" in rawEventImport)) {
			err("does not contain property 'getEvent'");
		}

		if (typeof rawEventImport.getEvent !== "function") {
			err("exported property 'getEvent' is not of type function");
		}

		const rawEvent = rawEventImport.getEvent();

		if (typeof rawEvent !== "object") {
			err("exported property 'getEvent' does not export an object");
		}

		if (!("event" in rawEvent)) {
			err(
				"exported property 'getEvent' does not contain property 'event'"
			);
		}

		if (typeof rawEvent.event !== "string") {
			err(
				"exported property 'getEvent' property 'event' is not of type string"
			);
		}

		if (!("execute" in rawEvent)) {
			err(
				"exported property 'getEvent' does not contain property 'execute'"
			);
		}

		if (typeof rawEvent.execute !== "function") {
			err(
				"exported property 'getEvent' property 'execute' is not of type function"
			);
		}

		events.add(rawEvent as EventExportData);
	}

	events.forEach(({ event, execute }) => {
		console.log(grey(`Loaded event '${event}'`));

		if (event === "ready") {
			client.on(event, (...args: Array<unknown>) => {
				execute(client, ...args);
			});

			return;
		}

		client.on(event, (...args: Array<unknown>) => {
			execute(...args);
		});
	});
}
