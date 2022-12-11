import commandMap from "./commandMap.js";

export default function () {
	// Transforms from Map<a, b> to Set<b>
	const commandsValuesArray = new Set(commandMap.values());

	return [...commandsValuesArray].map((command) => command.data);
}
