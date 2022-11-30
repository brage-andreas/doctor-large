import { readdirSync } from "fs";
import { COMMAND_DIR } from "../../constants.js";
import { type Command, type CommandImport } from "../../typings/index.js";

const commandMap: Map<string, Command> = new Map();

for (const folder of readdirSync(COMMAND_DIR)) {
	const FOLDER_DIR = new URL(`../../commands/${folder}`, import.meta.url);

	const fileNames: Array<string> = readdirSync(FOLDER_DIR).filter(
		(fileName) =>
			fileName.toLowerCase().endsWith(".js") &&
			!fileName.toLowerCase().startsWith("noread.")
	);

	for (const fileName of fileNames) {
		const commandModule = (await import(
			`../../commands/${folder}/${fileName}`
		)) as CommandImport;

		const command = commandModule.getCommand();

		commandMap.set(command.data.name, command);
	}
}

export default function () {
	return commandMap;
}
