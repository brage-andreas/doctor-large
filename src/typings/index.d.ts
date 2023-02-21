import type { Giveaway, Prize, Winner } from "@prisma/client";
import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";

type Prop<T extends object, P extends keyof T> = T[P];

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

interface PrizesOfMapObj {
	prize: Prize;
	winner: Winner;
	count: number;
}

export type GiveawayId = Prop<Giveaway, "id">;
export type PrizeId = Prop<Prize, "id">;
export type WinnerId = Prop<Winner, "id">;
export type Snowflake = string;
