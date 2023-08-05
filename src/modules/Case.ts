import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import {
	type Case,
	type CaseType,
	type Note,
	type Report
} from "@prisma/client";
import { type Client, type Guild } from "discord.js";

export class CaseModule implements CaseWithIncludes {
	public client: Client<true>;
	public data: CaseWithIncludes;
	public guild: Guild;
	public manager: CaseManager;

	public id: number;
	public guildId: string;
	public guildRelativeId: number;
	public createdAt: Date;
	public type: CaseType;
	public daysPruned: number | null;
	public dmMessageId: string | null;
	public expiration: Date | null;
	public logMessageChannelId: string | null;
	public logMessageId: string | null;
	public moderatorUserId: string;
	public moderatorUsername: string;
	public note: Note | null;
	public noteId: number | null;
	public originalSlowmode: number | null;
	public persistant: boolean | null;
	public processed: boolean;
	public reason: string | null;
	public reference: Case | null;
	public referencedBy: Array<Case>;
	public referenceId: number | null;
	public report: Report | null;
	public reportId: number | null;
	public roles: Array<string>;
	public targetIds: Array<string>;
	public targetUsername: string | null;
	public temporary: boolean | null;
	public newSlowmode: number | null;

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
}
