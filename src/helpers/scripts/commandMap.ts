import { existsSync, lstatSync, readdirSync } from "fs";
import { COMMAND_DIR } from "../../constants.js";
import { type Command, type CommandImport } from "../../typings/index.js";

const commandMap: Map<string, Command> = new Map();

const importAndSetCommandIntoMap = async (relativePath: string) => {
	const commandImport = (await import(
		`../../commands/${relativePath}`
	)) as CommandImport;

	const cmd = commandImport.getCommand();

	commandMap.set(cmd.data.name, cmd);
};

for (const fileOrFolderName of readdirSync(COMMAND_DIR)) {
	const path = new URL(`../../commands/${fileOrFolderName}`, import.meta.url);

	// if path exists and is a folder
	if (existsSync(path) && lstatSync(path).isDirectory()) {
		for (const fileName of readdirSync(path)) {
			await importAndSetCommandIntoMap(`${fileOrFolderName}/${fileName}`);
		}
	} else {
		// fileOrFolderName is a filename
		await importAndSetCommandIntoMap(fileOrFolderName);
	}
}

export default commandMap;
