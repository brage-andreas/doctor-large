import { ACTIVITIES } from "#constants";
import Logger from "#logger";
import { type EventExport } from "#typings";
import { Events, type Client } from "discord.js";
import checkTimestamps from "../jobs/index.js";

const execute = (client: Client<true>) => {
	new Logger({ prefix: "READY", color: "green" }).log(
		`Online as ${client.user.tag} (${client.user.id})`
	);

	setInterval(() => {
		checkTimestamps({ client, jobs: { all: true } });
	}, 60_000 /* 1 minute */);

	const getActivity = () => [
		ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]
	];

	setInterval(() => {
		client.user.setPresence({
			activities: getActivity()
		});
	}, 43_200_000 /* 12 hours */);
};

export const getEvent: () => EventExport = () => ({
	event: Events.ClientReady,
	execute
});
