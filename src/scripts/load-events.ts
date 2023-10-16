import { type EventExportData, type EventImport } from "#typings";
import { readdirSync, statSync } from "node:fs";
import { grey } from "../logger/color.js";
import { type Client } from "discord.js";
import { EVENT_DIR } from "#constants";
import console from "node:console";

const isFolder = (url: URL) => statSync(url, { throwIfNoEntry: false })?.isDirectory();

export default async function loadEvents(client: Client) {
	const events = new Set<EventExportData>();

	for (const fileName of readdirSync(EVENT_DIR)) {
		const url = new URL(`../events/${fileName}`, import.meta.url);

		if (isFolder(url) || !fileName.endsWith(".js")) {
			continue;
		}

		const error = (string: string) => {
			throw new TypeError(`File '/events/${fileName}' ${string}`);
		};

		const rawEventImport = (await import(url.toString())) as EventImport;

		if (typeof rawEventImport !== "object") {
			error("does not export an object");
		}

		if (!("getEvent" in rawEventImport)) {
			error("does not contain property 'getEvent'");
		}

		if (typeof rawEventImport.getEvent !== "function") {
			error("exported property 'getEvent' is not of type function");
		}

		const rawEvent = rawEventImport.getEvent();

		if (typeof rawEvent !== "object") {
			error("exported property 'getEvent' does not export an object");
		}

		if (!("event" in rawEvent)) {
			error("exported property 'getEvent' does not contain property 'event'");
		}

		if (typeof rawEvent.event !== "string") {
			error("exported property 'getEvent' property 'event' is not of type string");
		}

		if (!("execute" in rawEvent)) {
			error("exported property 'getEvent' does not contain property 'execute'");
		}

		if (typeof rawEvent.execute !== "function") {
			error("exported property 'getEvent' property 'execute' is not of type function");
		}

		events.add(rawEvent);
	}

	for (const { event, execute } of events) {
		console.log(grey(`Loaded event '${event}'`));

		if (event === "ready") {
			client.on(event, (...arguments_: Array<unknown>) => {
				execute(client, ...arguments_);
			});

			continue;
		}

		client.on(event, (...arguments_: Array<unknown>) => {
			execute(...arguments_);
		});
	}
}
