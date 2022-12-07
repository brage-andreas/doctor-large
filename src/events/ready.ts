import { oneLine } from "common-tags";
import { type Client } from "discord.js";

export function run(client: Client) {
	console.log(
		oneLine`
			${new Date()} - Online as
			${client.user?.tag ?? "Unknown tag"}
			(${client.user?.id ?? "Unknown id"})
		`
	);
}
