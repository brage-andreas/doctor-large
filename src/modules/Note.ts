import { type CaseWithIncludes, type NoteWithIncludes } from "#typings";
import { type Client, type EmbedData, type Guild } from "discord.js";
import type NoteManager from "#database/note.js";
import { getUsername, s } from "#helpers";
import { ColorsHex } from "#constants";

export class NoteModule implements NoteWithIncludes {
	public author: string;
	public authorUserId: string;
	public authorUsername: string;
	public client: Client<true>;

	public content: string;
	public createdAt: Date;
	public data: NoteWithIncludes;
	public guild: Guild;
	public guildId: string;
	public guildRelativeId: number;
	public id: number;
	public manager: NoteManager;
	public referencedBy: Array<CaseWithIncludes>;
	public target: string;

	public targetUserId: string;
	public targetUsername: string;

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

		this.author = getUsername({
			id: this.authorUserId,
			tag: this.authorUsername,
		});

		this.target = getUsername({
			id: this.targetUserId,
			tag: this.targetUsername,
		});
	}

	public toEmbed(): EmbedData {
		const referencedString =
			this.referencedBy.length > 0
				? `• Referenced by ${this.referencedBy.length} ${s("case", this.referencedBy.length)}`
				: "";

		return {
			author: { name: `${this.target} (${this.targetUserId})` },
			color: ColorsHex.Yellow,
			description: this.content,
			footer: {
				text: `Note #${this.guildRelativeId} • By ${this.author} (${this.authorUserId}) ${referencedString}`,
			},
			timestamp: this.createdAt,
		};
	}

	public toShortList() {
		return `* (#${this.guildRelativeId}) ${this.content}`;
	}
}
