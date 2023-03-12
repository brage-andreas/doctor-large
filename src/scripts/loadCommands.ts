import { COMMAND_DIR } from "#constants";
import { type CommandExport, type CommandImport } from "#typings";
import { existsSync, lstatSync, readdirSync } from "fs";
import console from "node:console";
import { grey } from "../logger/color.js";

const commands: Map<string, CommandExport> = new Map();

const importAndSetCommandIntoMap = async (relativePath: string) => {
	const err = (string: string) => {
		throw new Error(`File '/commands/${relativePath}' ${string}`);
	};

	const rawCommandImport = await import(`../commands/${relativePath}`);

	if (typeof rawCommandImport !== "object") {
		err("does not export an object");
	}

	if (!("getCommand" in rawCommandImport)) {
		err("does not contain property 'getCommand'");
	}

	if (typeof rawCommandImport.getCommand !== "function") {
		err("exported property 'getCommand' is not of type function");
	}

	const cmd = (rawCommandImport as CommandImport).getCommand();

	if (typeof cmd !== "object") {
		err("exported property 'getCommand' does not export an object");
	}

	if (!("data" in cmd)) {
		err("exported property 'getCommand' does not contain property 'data'");
	}

	if (typeof cmd.data !== "object") {
		err(
			"exported property 'getCommand' property 'data' is not of type object"
		);
	}

	if (!("handle" in cmd)) {
		err(
			"exported property 'getCommand' does not contain property 'handle'"
		);
	}

	if (typeof cmd.handle !== "object") {
		err(
			"exported property 'getCommand' property 'handle' is not of type object"
		);
	}

	if (!cmd.data.chatInput && !cmd.data.contextMenu) {
		err(
			"exported property 'getCommand' property 'data' missing 'chatInput' and 'contextMenu'. At least one is required"
		);
	}

	if (cmd.data.chatInput && !cmd.handle.chatInput) {
		err(
			"exported property 'getCommand' property 'data' has 'chatInput' present, but is missing 'chatInput' handle"
		);
	}

	if (cmd.data.contextMenu && !cmd.handle.contextMenu) {
		err(
			"exported property 'getCommand' property 'data' has 'contextMenu' present, but is missing 'contextMenu' handle"
		);
	}

	if (!cmd.handle.chatInput && cmd.handle.autocomplete) {
		err(
			"exported property 'getCommand' property 'data' has 'autocomple' handle present, but is missing 'chatInput' handle"
		);
	}

	if (cmd.data.chatInput) {
		commands.set(cmd.data.chatInput.name, cmd);
	}

	if (cmd.data.contextMenu) {
		commands.set(cmd.data.contextMenu.name, cmd);
	}

	console.log(
		grey`Loaded command '${
			cmd.data.chatInput?.name ?? cmd.data.contextMenu?.name
		}'`
	);
};

const isFolder = (url: URL) => existsSync(url) && lstatSync(url).isDirectory();

for (const fileOrFolderName of readdirSync(COMMAND_DIR)) {
	const path = new URL(`../commands/${fileOrFolderName}`, import.meta.url);

	// if path exists and is a folder
	if (isFolder(path)) {
		for (const nestedFileOrFolderName of readdirSync(path)) {
			if (nestedFileOrFolderName.toLowerCase().startsWith("mod.")) {
				continue;
			}

			const nestedPath = new URL(
				`../commands/${fileOrFolderName}/${nestedFileOrFolderName}`,
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

export default commands;
