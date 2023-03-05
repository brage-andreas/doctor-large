import { COMMAND_DIR } from "#constants";
import { type CommandExport, type CommandImport } from "#typings";
import { existsSync, lstatSync, readdirSync } from "fs";

const commandMap: Map<string, CommandExport> = new Map();

const importAndSetCommandIntoMap = async (relativePath: string) => {
	const commandImport = (await import(
		`../../commands/${relativePath}`
	)) as CommandImport;

	const err = (string: string) => {
		throw new Error(
			`Command imported from "/commands/${relativePath}" ${string}`
		);
	};

	const cmd = commandImport.getCommand();

	if (!("data" in cmd)) {
		err("missing 'data'");
	}

	if (!("handle" in cmd)) {
		err("missing 'handle'");
	}

	if (!cmd.data.chatInput && !cmd.data.contextMenu) {
		err("missing 'chatInput' and 'contextMenu'. At least one is required");
	}

	if (cmd.data.chatInput && !cmd.handle.chatInput) {
		err("has 'chatInput' present, but is missing handle fn");
	}

	if (cmd.data.contextMenu && !cmd.handle.contextMenu) {
		err("has 'contextMenu' present, but is missing handle fn");
	}

	if (!cmd.handle.chatInput && cmd.handle.autocomplete) {
		err(
			"has 'autocomple' handle present, but is missing 'chatInput' handle fn"
		);
	}

	commandMap.set(cmd.data.commandName, cmd);
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

export const getCommandFromCommandMap = (commandName: string) => {
	const get = commandMap.get(commandName);

	if (get) {
		return get;
	}

	const find = [...commandMap.values()].find(
		(cmd) =>
			cmd.data.chatInput?.name === commandName ||
			cmd.data.contextMenu?.name === commandName
	);

	return find ?? null;
};

export default commandMap;
