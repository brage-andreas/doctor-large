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
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "discord.js";
import { type Case, type Giveaway, type Note, type Prize, type Report, type Winner } from "@prisma/client";
import type GiveawayModule from "#modules/Giveaway.js";

declare global {
	namespace NodeJS {
		interface ProcessEnvironment {
			DATABASE_URL: `postgres://${string}:${string}@${string}:${number}/${string}?schema=${string}`;
			DISCORD_APPLICATION_ID: string;
			DISCORD_APPLICATION_TOKEN: string;
			GUILD_ID?: string | undefined;
		}
	}
}

type Property<T extends object, P extends keyof T> = T[P];

export type Color = "black" | "blue" | "green" | "grey" | "red" | "white" | "yellow";

export interface EventExportData {
	event: keyof ClientEvents;
	execute(...arguments_: Array<unknown>): unknown;
}
export interface EventImport {
	getEvent(): EventExportData;
}
export type EventExport = () => EventExportData;

export interface CommandExportData {
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
		autocomplete?(interaction: AutocompleteInteraction<"cached">): unknown;
		chatInput?(interaction: ChatInputCommandInteraction<"cached">): unknown;
		contextMenu?(interaction: ContextMenuCommandInteraction<"cached">): unknown;
	};
}
export interface CommandImport {
	getCommand(): CommandExportData;
}
export type CommandData = Property<CommandExportData, "data">;
export type CommandExport = () => CommandExportData;
export type CommandHandle = Property<CommandExportData, "handle">;

export type GiveawayId = Property<Giveaway, "id">;
export type PrizeId = Property<Prize, "id">;
export type WinnerId = Property<Winner, "id">;
export type Snowflake = string;

export type GiveawayWithIncludes = Giveaway & {
	prizes: Array<Prize & { winners: Array<Winner> }>;
};

export type PrizeWithIncludes = Prize & {
	giveaway: GiveawayModule;
	winners: Array<Winner>;
};

export type CaseWithIncludes = Case & {
	note: Note | null;
	reference: Case | null;
	referencedBy: Array<Case>;
	report: Report | null;
};

export type ReportWithIncludes = Report & {
	referencedBy: Array<CaseWithIncludes>;
};

export type NoteWithIncludes = Note & {
	referencedBy: Array<CaseWithIncludes>;
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

export interface ComponentObject<T extends CreateRowsCompatibleAPIComponent = CreateRowsCompatibleAPIComponent> {
	component(...parameters: Array<unknown>): T;
	readonly customId?: string;
}

export interface ComponentObjectWithNoParameters<
	T extends CreateRowsCompatibleAPIComponent = CreateRowsCompatibleAPIComponent,
> extends ComponentObject<T> {
	component(): T;
}

export type CustomIdCompatibleButtonStyle =
	| ButtonStyle.Danger
	| ButtonStyle.Primary
	| ButtonStyle.Secondary
	| ButtonStyle.Success;

export interface CreateRows {
	(...components: CreateRowsInput): Array<CreateRowsCompatibleRow>;
	specific(
		lengthRow1?: number,
		lengthRow2?: number,
		lengthRow3?: number,
		lengthRow4?: number,
		lengthRow5?: number
	): (...components: CreateRowsInput) => Array<CreateRowsCompatibleRow>;
	uniform(length?: number): (...components: CreateRowsInput) => Array<CreateRowsCompatibleRow>;
}

export type CreateRowsInput = Array<
	ComponentObjectWithNoParameters | CreateRowsCompatibleAPIComponent | null | undefined
>;

export interface CountPrizeWinner {
	count: number;
	prize: Prize;
	winner: Winner;
}
