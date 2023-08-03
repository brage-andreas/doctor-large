import type NoteManager from "#database/note.js";

import { ColorsHex } from "#constants";
import { s } from "#helpers";
import { type CaseWithIncludes, type NoteWithIncludes } from "#typings";
import { type Report } from "@prisma/client";
import { type Client, type EmbedData, type Guild } from "discord.js";
import getTag from "../helpers/getTag.js";
export const isMessageReport = (
	data: Report
): data is Report & {
	targetMessageChannelId: string;
	targetMessageId: string;
} => Boolean(data.targetMessageChannelId) && Boolean(data.targetMessageId);

export class NoteModule implements NoteWithIncludes {
	public client: Client<true>;
	public data: NoteWithIncludes;
	public guild: Guild;
	public manager: NoteManager;

	public id: number;
	public guildId: string;
	public createdAt: Date;
	public guildRelativeId: number;
	public authorUserId: string;
	public authorUsername: string;
	public content: string;
	public referencedBy: Array<CaseWithIncludes>;
	public targetUserId: string;
	public targetUsername: string;

	public author: string;
	public target: string;

	public constructor(manager: NoteManager, data: NoteWithIncludes) {
		this.manager = manager;
		this.client = manager.guild.client;
		this.guild = manager.guild;
		this.data = data;

		this.id = data.id;
		this.guildId = data.guildId;
		this.createdAt = data.createdAt;
		this.guildRelativeId = data.guildRelativeId;
		this.authorUserId = data.authorUserId;
		this.authorUsername = data.authorUsername;
		this.content = data.content;
		this.referencedBy = data.referencedBy;
		this.targetUserId = data.targetUserId;
		this.targetUsername = data.targetUsername;

		this.author = getTag({
			tag: this.authorUsername,
			id: this.authorUserId
		});

		this.target = getTag({
			tag: this.targetUsername,
			id: this.targetUserId
		});
	}

	public toShortList() {
		return `* (#${this.guildRelativeId}) ${this.content}`;
	}

	public toEmbed(): EmbedData {
		const referencedString = this.referencedBy.length
			? `• Referenced by ${this.referencedBy.length} ${s(
					"case",
					this.referencedBy.length
			  )}`
			: "";

		return {
			author: { name: `${this.target} (${this.targetUserId})` },
			color: ColorsHex.Yellow,
			description: this.content,
			timestamp: this.createdAt,
			footer: {
				text: `Note #${this.guildRelativeId} • By ${this.author} (${this.authorUserId}) ${referencedString}`
			}
		};
	}
}
