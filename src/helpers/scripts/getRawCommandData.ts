import { type RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import commandMap from "./commandMap.js";

export default function getRawCommandData(): Array<RESTPostAPIApplicationCommandsJSONBody> {
	const commandsValuesSet = new Set(commandMap.values());
	const commandsValuesArray = [...commandsValuesSet];

	return commandsValuesArray.flatMap(({ data }) =>
		[data.chatInput, data.contextMenu].filter(Boolean)
	) as Array<RESTPostAPIApplicationCommandsJSONBody>;
}
