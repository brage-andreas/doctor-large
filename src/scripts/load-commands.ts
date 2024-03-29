import { type CommandExportData, type CommandImport } from "#typings";
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { grey } from "../logger/color.js";
import { COMMAND_DIR } from "#constants";
import console from "node:console";

const commands = new Map<string, CommandExportData>();

const importAndSetCommandIntoMap = async (relativePath: string) => {
	const error = (string: string) => {
		throw new TypeError(`File '/commands/${relativePath}' ${string}`);
	};

	const rawCommandImport = (await import(`../commands/${relativePath}`)) as unknown;

	if (typeof rawCommandImport !== "object") {
		error("does not export an object");
	}

	if (!("getCommand" in (rawCommandImport as object))) {
		error("does not contain property 'getCommand'");
	}

	if (typeof (rawCommandImport as { getCommand: unknown }).getCommand !== "function") {
		error("exported property 'getCommand' is not of type function");
	}

	const cmd = (rawCommandImport as CommandImport).getCommand();

	if (typeof cmd !== "object") {
		error("exported property 'getCommand' does not export an object");
	}

	if (!("data" in cmd)) {
		error("exported property 'getCommand' does not contain property 'data'");
	}

	if (typeof cmd.data !== "object") {
		error("exported property 'getCommand' property 'data' is not of type object");
	}

	if (!("handle" in cmd)) {
		error("exported property 'getCommand' does not contain property 'handle'");
	}

	if (typeof cmd.handle !== "object") {
		error("exported property 'getCommand' property 'handle' is not of type object");
	}

	if (!cmd.data.chatInput && !cmd.data.contextMenu) {
		error(
			"exported property 'getCommand' property 'data' missing 'chatInput' and 'contextMenu'. At least one is required"
		);
	}

	if (cmd.data.chatInput && !cmd.handle.chatInput) {
		error("exported property 'getCommand' property 'handle' has 'chatInput' present, but is missing 'chatInput'");
	}

	if (cmd.data.contextMenu && !cmd.handle.contextMenu) {
		error(
			"exported property 'getCommand' property 'handle' has 'contextMenu' present, but is missing 'contextMenu'"
		);
	}

	if (!cmd.handle.chatInput && cmd.handle.autocomplete) {
		error(
			"exported property 'getCommand' property 'handle' has 'autocomple' handle present, but is missing 'chatInput'"
		);
	}

	if (!cmd.data.messageContextMenu && cmd.data.userContextMenu) {
		error(
			"exported property 'getCommand' property 'data' has 'messageContextMenu' data present, but is missing 'userContextMenu' data"
		);
	}

	if (cmd.data.messageContextMenu && !cmd.data.userContextMenu) {
		error(
			"exported property 'getCommand' property 'data' has 'userContextMenu' data present, but is missing 'messageContextMenu' data"
		);
	}

	if (cmd.data.contextMenu && (cmd.data.messageContextMenu || cmd.data.userContextMenu)) {
		error(
			"exported property 'getCommand' property 'data' has 'contextMenu' data present, but also has 'messageContextMenu' or 'userContexMenu'"
		);
	}

	if ((cmd.data.messageContextMenu || cmd.data.userContextMenu) && !cmd.handle.contextMenu) {
		error(
			"exported property 'getCommand' property 'data' has 'contextMenu' data present, but is missing 'contextMenu' handle"
		);
	}

	let name = `/commands/${relativePath}`;

	if (cmd.data.userContextMenu) {
		commands.set(cmd.data.userContextMenu.name, cmd);

		name = cmd.data.userContextMenu.name;
	}

	if (cmd.data.messageContextMenu) {
		commands.set(cmd.data.messageContextMenu.name, cmd);

		name = cmd.data.messageContextMenu.name;
	}

	if (cmd.data.contextMenu) {
		commands.set(cmd.data.contextMenu.name, cmd);

		name = cmd.data.contextMenu.name;
	}

	if (cmd.data.chatInput) {
		commands.set(cmd.data.chatInput.name, cmd);

		name = cmd.data.chatInput.name;
	}

	console.log(grey(`Loaded command '${name}'`));
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

			const nestedPath = new URL(`../commands/${fileOrFolderName}/${nestedFileOrFolderName}`, import.meta.url);

			if (isFolder(nestedPath)) {
				continue;
			}

			await importAndSetCommandIntoMap(`${fileOrFolderName}/${nestedFileOrFolderName}`);
		}
	} else {
		if (fileOrFolderName.toLowerCase().startsWith("mod.")) {
			continue;
		}

		await importAndSetCommandIntoMap(fileOrFolderName);
	}
}

export default commands;
