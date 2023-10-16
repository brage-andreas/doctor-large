import { type Case, CaseType, type Note, type Report } from "@prisma/client";
import type BanCaseModule from "./case-modules/ban.js";
import { type Client, type Guild } from "discord.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";

export class CaseModule implements CaseWithIncludes {
	public client: Client<true>;
	public createdAt: Date;
	public data: CaseWithIncludes;
	public daysPruned: null | number;

	public dmMessageId: null | string;
	public expiration: Date | null;
	public guild: Guild;
	public guildId: string;
	public guildRelativeId: number;
	public id: number;
	public logMessageChannelId: null | string;
	public logMessageId: null | string;
	public manager: CaseManager;
	public moderatorUserId: string;
	public moderatorUsername: string;
	public newSlowmode: null | number;
	public note: Note | null;
	public noteId: null | number;
	public originalSlowmode: null | number;
	public persistant: boolean | null;
	public processed: boolean;
	public reason: null | string;
	public reference: Case | null;
	public referenceId: null | number;
	public referencedBy: Array<Case>;
	public report: Report | null;
	public reportId: null | number;
	public roles: Array<string>;
	public targetIds: Array<string>;
	public targetUsername: null | string;
	public temporary: boolean | null;
	public type: CaseType;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		this.manager = manager;
		this.client = manager.guild.client;
		this.guild = manager.guild;
		this.data = data;

		this.id = data.id;
		this.guildId = data.guildId;
		this.guildRelativeId = data.guildRelativeId;
		this.createdAt = data.createdAt;
		this.type = data.type;
		this.daysPruned = data.daysPruned;
		this.dmMessageId = data.dmMessageId;
		this.expiration = data.expiration;
		this.logMessageChannelId = data.logMessageChannelId;
		this.logMessageId = data.logMessageId;
		this.moderatorUserId = data.moderatorUserId;
		this.moderatorUsername = data.moderatorUsername;
		this.note = data.note;
		this.noteId = data.noteId;
		this.originalSlowmode = data.originalSlowmode;
		this.persistant = data.persistant;
		this.processed = data.processed;
		this.reason = data.reason;
		this.reference = data.reference;
		this.referencedBy = data.referencedBy;
		this.referenceId = data.referenceId;
		this.report = data.report;
		this.reportId = data.reportId;
		this.roles = data.roles;
		this.targetIds = data.targetIds;
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.newSlowmode = data.newSlowmode;
	}

	public isBan(): this is BanCaseModule {
		return this.type === CaseType.Ban;
	}
}
