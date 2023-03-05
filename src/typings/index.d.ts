import type GiveawayModule from "#modules/Giveaway.js";
import type { Giveaway, Prize, Winner } from "@prisma/client";
import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	Events,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	RESTPostAPIContextMenuApplicationCommandsJSONBody
} from "discord.js";

type Prop<T extends object, P extends keyof T> = T[P];
type UnknownOrPromise = Promise<unknown> | unknown;

export type Color =
	| "black"
	| "blue"
	| "green"
	| "grey"
	| "red"
	| "white"
	| "yellow";

export interface EventExport {
	event: Events;
	execute(...args: Array<unknown>): Promise<unknown> | unknown;
}

export interface EventImport {
	getEvent(): EventExport;
}

export type CommandModuleInteractions =
	| AutocompleteInteraction<"cached">
	| ChatInputCommandInteraction<"cached">
	| ContextMenuCommandInteraction<"cached">;

interface CommandExport {
	data: {
		commandName: string;
		chatInput?: RESTPostAPIChatInputApplicationCommandsJSONBody;
		contextMenu?: RESTPostAPIContextMenuApplicationCommandsJSONBody;
	};
	handle: {
		autocomplete?(interaction: CommandModuleInteractions): UnknownOrPromise;
		chatInput?(interaction: CommandModuleInteractions): UnknownOrPromise;
		contextMenu?(interaction: CommandModuleInteractions): UnknownOrPromise;
	};
}

export type CommandData = Prop<CommandExport, "data">;

export interface CommandImport {
	getCommand(): CommandExport;
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

export type GiveawayWithIncludes = Giveaway & {
	prizes: Array<Prize & { winners: Array<Winner> }>;
};

export type PrizeWithIncludes = Prize & {
	winners: Array<Winner>;
	giveaway: GiveawayModule;
};
