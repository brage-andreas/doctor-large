import { type Client, Events } from "discord.js";
import checkTimestamps from "../jobs/index.js";
import { type EventExport } from "#typings";
import { ACTIVITIES } from "#constants";
import console from "node:console";
import Logger from "#logger";

const execute = (client: Client<true>) => {
	console.log();

	new Logger({ color: "green", label: "READY" }).log(`Online as ${client.user.tag} (${client.user.id})`);

	setInterval(() => {
		checkTimestamps({ client, jobs: { all: true } });
	}, 60_000 /* 1 minute */);

	const getActivity = () => [ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]];

	setInterval(() => {
		client.user.setPresence({
			activities: getActivity(),
		});
	}, 43_200_000 /* 12 hours */);
};

export const getEvent: EventExport = () => ({
	event: Events.ClientReady,
	execute,
});
