import { type Base, type Client } from "discord.js";

export default async function commandMention(commandName: string, client: Base | Client<true>) {
	const client_ = "client" in client ? client.client : client;

	const command = await client_.application.commands
		.fetch()
		.then((commands) => commands.find((command) => command.name === commandName.split(" ")[0]));

	return command ? `</${commandName}:${command.id}>` : `/${commandName}`;
}
