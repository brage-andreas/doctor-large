import type GiveawayModule from "#modules/Giveaway.js";
import { type Giveaway, type Prize, type Winner } from "@prisma/client";
import {
	type APIActionRowComponent,
	type APIButtonComponent,
	type APIChannelSelectComponent,
	type APIMentionableSelectComponent,
	type APIRoleSelectComponent,
	type APISelectMenuComponent,
	type APIUserSelectComponent,
	type ApplicationCommandType,
	type AutocompleteInteraction,
	type ButtonStyle,
	type ChatInputCommandInteraction,
	type ClientEvents,
	type ContextMenuCommandInteraction,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody
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
	event: keyof ClientEvents;
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
		chatInput?: RESTPostAPIChatInputApplicationCommandsJSONBody;
		contextMenu?: RESTPostAPIContextMenuApplicationCommandsJSONBody;
		messageContextMenu?: RESTPostAPIContextMenuApplicationCommandsJSONBody & {
			type: ApplicationCommandType.Message;
		};
		userContextMenu?: RESTPostAPIContextMenuApplicationCommandsJSONBody & {
			type: ApplicationCommandType.User;
		};
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

export type CreateRowsCompatibleAPIComponent =
	| APIButtonComponent
	| APIChannelSelectComponent
	| APIMentionableSelectComponent
	| APIRoleSelectComponent
	| APISelectMenuComponent
	| APIUserSelectComponent;

export type CreateRowsCompatibleRow =
	| APIActionRowComponent<APIButtonComponent>
	| APIActionRowComponent<APIChannelSelectComponent>
	| APIActionRowComponent<APIMentionableSelectComponent>
	| APIActionRowComponent<APIRoleSelectComponent>
	| APIActionRowComponent<APISelectMenuComponent>
	| APIActionRowComponent<APIUserSelectComponent>;

export interface ComponentObject<
	T extends CreateRowsCompatibleAPIComponent = CreateRowsCompatibleAPIComponent
> {
	readonly customId?: string;
	component(...params: Array<unknown>): T;
}

export interface ComponentObjectWithNoParams<
	T extends CreateRowsCompatibleAPIComponent = CreateRowsCompatibleAPIComponent
> extends ComponentObject<T> {
	component(): T;
}

export type CustomIdCompatibleButtonStyle =
	| ButtonStyle.Danger
	| ButtonStyle.Primary
	| ButtonStyle.Secondary
	| ButtonStyle.Success;
