import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";

export type EventFn = (...args: Array<unknown>) => Promise<unknown> | unknown;

export type Color =
	| "black"
	| "blue"
	| "green"
	| "grey"
	| "red"
	| "white"
	| "yellow";

export interface EventImport {
	run: EventFn;
}

export type CommandModuleInteractions =
	| AutocompleteInteraction<"cached">
	| ChatInputCommandInteraction<"cached">
	| ContextMenuCommandInteraction<"cached">;

export interface Command {
	data: RESTPostAPIApplicationCommandsJSONBody;
	run(interaction: CommandModuleInteractions): Promise<unknown> | unknown;
}

export interface CommandImport {
	getCommand(): Command;
}
