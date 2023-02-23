import { COMMAND_DIR } from "#constants";
import { type Command, type CommandImport } from "#typings";
import { existsSync, lstatSync, readdirSync } from "fs";

const commandMap: Map<string, Command> = new Map();

const importAndSetCommandIntoMap = async (relativePath: string) => {
	const commandImport = (await import(
		`../../commands/${relativePath}`
	)) as CommandImport;

	const cmd = commandImport.getCommand();

	commandMap.set(cmd.data.name, cmd);
};

const isFolder = (url: URL) => existsSync(url) && lstatSync(url).isDirectory();

for (const fileOrFolderName of readdirSync(COMMAND_DIR)) {
	const path = new URL(`../../commands/${fileOrFolderName}`, import.meta.url);

	// if path exists and is a folder
	if (isFolder(path)) {
		for (const nestedFileOrFolderName of readdirSync(path)) {
			if (nestedFileOrFolderName.toLowerCase().startsWith("mod.")) {
				continue;
			}

			const nestedPath = new URL(
				`../../commands/${fileOrFolderName}/${nestedFileOrFolderName}`,
				import.meta.url
			);

			if (isFolder(nestedPath)) {
				continue;
			}

			await importAndSetCommandIntoMap(
				`${fileOrFolderName}/${nestedFileOrFolderName}`
			);
		}
	} else {
		if (fileOrFolderName.toLowerCase().startsWith("mod.")) {
			continue;
		}

		await importAndSetCommandIntoMap(fileOrFolderName);
	}
}

export default commandMap;
