import commandMap from "./commandMap.js";

export default function () {
	// Gets the commands and turns from Map<a, b> to Array<b>
	const commandsValuesArray = [...commandMap.values()];
	// Turns it to Set<b> and back to Array<b> to remove duplicates
	const uniqueCommandsArray = [...new Set(commandsValuesArray)];

	return uniqueCommandsArray.map((command) => command.data);
}
