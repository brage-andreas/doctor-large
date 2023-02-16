import { type Client } from "discord.js";
import checkTimestamps from "../checkTimestamps.js";
import Logger from "../logger/logger.js";

export function run(client: Client<true>) {
	new Logger({ prefix: "READY", color: "green" }).log(
		`Online as ${client.user.tag} (${client.user.id})`
	);

	setInterval(() => {
		checkTimestamps({ client, checkEndingGiveaways: true });
	}, 60_000);
}
