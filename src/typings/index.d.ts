import type GiveawayModule from "#modules/Giveaway.js";
import type { Giveaway, Prize, Winner } from "@prisma/client";
import type {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	RESTPostAPIContextMenuApplicationCommandsJSONBody
} from "discord.js";

type Prop<T extends object, P extends keyof T> = T[P];
type UnknownOrPromise = Promise<unknown> | unknown;

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

interface Command {
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

export type CommandData = Prop<Command, "data">;

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

export type GiveawayWithIncludes = Giveaway & {
	prizes: Array<Prize & { winners: Array<Winner> }>;
};

export type PrizeWithIncludes = Prize & {
	winners: Array<Winner>;
	giveaway: GiveawayModule;
};
