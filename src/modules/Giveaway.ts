import { type Prisma } from "@prisma/client";
import { id, oneLine, stripIndents } from "common-tags";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type Client,
	type Guild
} from "discord.js";
import ms from "ms";
import { EMOJIS } from "../constants.js";
import { default as GiveawayManager } from "../database/giveaway.js";
import { listify } from "../helpers/listify.js";
import s from "../helpers/s.js";
import { longStamp, timestamp } from "../helpers/timestamps.js";
import { type GiveawayDataWithIncludes } from "../typings/database.js";
import Prize from "./Prize.js";

export default class Giveaway {
	public readonly manager: GiveawayManager;
	public client: Client<true>;
	public data: GiveawayDataWithIncludes;
	public guild: Guild;

	// --
	public active: boolean;
	public channelId: string | null;
	public createdTimestamp: string;
	public description: string | null;
	public endTimestamp: string | null;
	public entriesLocked: boolean;
	public entriesUserIds: Array<string>;
	public guildId: string;
	public guildRelativeId: number;
	public hostUserId: string;
	public hostUserTag: string;
	public id: number;
	public lastEditedTimestamp: string | null;
	public lastEditedUserId: string | null;
	public lastEditedUserTag: string | null;
	public minimumAccountAge: string | null;
	public pingRolesIds: Array<string>;
	public prizes: Array<Prize>;
	public publishedMessageId: string | null;
	public requiredRolesIds: Array<string>;
	public title: string;
	public winnerMessageId: string | null;
	public winnerQuantity: number;
	// --

	private _prizesQuantity: number | null = null;
	private _winnersUserIds: Set<string> | null = null;

	public constructor(data: GiveawayDataWithIncludes, guild: Guild) {
		this.client = guild.client;
		this.guild = guild;
		this.data = data;

		this.manager = new GiveawayManager(guild);

		// --
		this.lastEditedTimestamp = data.lastEditedTimestamp;
		this.publishedMessageId = data.publishedMessageId;
		this.lastEditedUserTag = data.lastEditedUserTag;
		this.minimumAccountAge = data.minimumAccountAge;
		this.createdTimestamp = data.createdTimestamp;
		this.lastEditedUserId = data.lastEditedUserId;
		this.requiredRolesIds = data.requiredRolesIds;
		this.winnerMessageId = data.winnerMessageId;
		this.guildRelativeId = data.guildRelativeId;
		this.entriesUserIds = data.entriesUserIds;
		this.winnerQuantity = data.winnerQuantity;
		this.entriesLocked = data.entriesLocked;
		this.endTimestamp = data.endTimestamp;
		this.pingRolesIds = data.pingRolesIds;
		this.description = data.description;
		this.hostUserTag = data.hostUserTag;
		this.hostUserId = data.hostUserId;
		this.channelId = data.channelId;
		this.guildId = data.guildId;
		this.active = data.active;
		this.title = data.title;
		this.id = data.id;

		this.prizes = data.prizes.map(
			(prize) => new Prize({ ...prize, giveaway: this }, guild)
		);
		//--
	}

	public get prizesQuantity() {
		if (this._prizesQuantity === null) {
			this._prizesQuantity = this.prizes.reduce(
				(acc, prize) => acc + prize.quantity,
				0
			);
		}

		return this._prizesQuantity;
	}

	public get winnersUserIds() {
		if (this._winnersUserIds === null) {
			this._winnersUserIds = this.prizes.reduce((set, e) => {
				e.winners.forEach((winner) => set.add(winner.userId));

				return set;
			}, new Set<string>());
		}

		return this._winnersUserIds;
	}

	public get isPublished() {
		return Boolean(this.publishedMessageId);
	}

	public toShortString() {
		const winners = s("winner", this.winnerQuantity);

		return oneLine`
			${this.guildRelativeId} **${this.title}** - ${this.winnerQuantity} ${winners},
			${this.prizesQuantity} ${s("prize", this.prizesQuantity)}
		`;
	}

	public toString() {
		//
	}

	public toFullString() {
		//
	}

	public toDashboardOverviewString() {
		const requiredRolesStr = this.requiredRolesIds.length
			? `→ Required roles (${this.requiredRolesIds.length}): ${listify(
					this.requiredRolesIds.map((roleId) => `<@&${roleId}>`),
					{ length: 5 }
			  )}`
			: "→ Required roles: None";

		const minimumAccountAgeStr = `→ Minimum account age: ${
			this.minimumAccountAge
				? ms(Number(this.minimumAccountAge), { long: true })
				: "None"
		}`;

		const pingRolesStr = this.pingRolesIds.length
			? `→ Ping roles (${this.pingRolesIds.length}): ${listify(
					this.pingRolesIds.map((roleId) => `<@&${roleId}>`),
					{ length: 10 }
			  )}`
			: "→ Ping roles: None";

		const badPingRoles = this.pingRolesIds.filter((roleId) => {
			const mentionable = this.guild.roles.cache.get(roleId)?.mentionable;
			const hasPerms = this.guild.members.me?.permissions.has(
				PermissionFlagsBits.MentionEveryone
			);

			return !mentionable && !hasPerms;
		});

		const pingRolesWarning = badPingRoles.length
			? oneLine`
			${EMOJIS.WARN} Missing permissions to ping roles (${badPingRoles.length}):
			${listify(
				badPingRoles.map((roleId) => `<@&${roleId}>`),
				{ length: 10 }
			)}
		`
			: null;

		const endStr = this.endTimestamp
			? `→ End date: ${longStamp(this.endTimestamp)}`
			: `→ End date: ${EMOJIS.WARN} The giveaway has no set end date. It will be open indefinitely!`;

		const prizesStr = this.prizes.length
			? `**Prizes** (${this.prizes.length}):\n${this.prizes
					.map((prize) => prize.toShortString())
					.join("\n")}`
			: `**Prizes**: ${EMOJIS.WARN} There are no set prizes`;

		const titleStr = `**Title**:\n\`\`\`\n${this.title}\n\`\`\``;

		const descriptionStr = `**Description**:\n${
			this.description
				? `\`\`\`\n${this.description}\n\`\`\``
				: `${EMOJIS.WARN} There is no set description`
		}`;

		const idStr = `#${id}`;
		const absoluteIdStr = `#${this.id}`;
		const numberOfWinnersStr = `→ Number of winners: ${this.winnerQuantity}`;
		const hostStr = `→ Host: ${this.hostUserTag} (${this.hostUserId})`;
		const activeStr = `→ Active: ${this.active ? "Yes" : "No"}`;
		const publishedStr = `→ Published: ${this.isPublished ? "Yes" : "No"}`;
		const entriesStr = `→ Entries: ${this.entriesUserIds.length}`;
		const createdStr = `→ Created: ${longStamp(this.createdTimestamp)}`;
		const lockEntriesStr = `→ Entries locked: ${
			this.entriesLocked ? "Yes" : "No"
		}`;

		const gId = this.guildId;
		const cId = this.channelId;
		const mId = this.publishedMessageId;
		const messageUrl =
			gId && cId && mId
				? `→ [Link to giveaway](<https://discord.com/channels/${gId}/${cId}/${mId}>)`
				: null;

		const winnersStr = this.winnersUserIds.size
			? oneLine`
				→ Winners (${this.winnersUserIds.size}/${this.winnerQuantity}):
				${[...this.winnersUserIds].map((id) => `<@${id}> (${id})`).join(", ")}
			`
			: "→ No winners";

		const editTag = this.lastEditedUserTag;
		const editUId = this.lastEditedUserId;
		const editStamp = this.lastEditedTimestamp;

		const lastEditStr =
			!editTag && !editUId && !editStamp
				? "No edits"
				: oneLine`
					Last edited by:
					${editTag ?? "Unknown tag"}
					(${editUId ?? "Unknown ID"})
					${editStamp ? timestamp(editStamp, "R") : "Unknown date"}
				`;

		return stripIndents`
		${titleStr}
		${descriptionStr}
		${prizesStr}

		**Info**:
		${hostStr}
		${createdStr}
		${entriesStr}
		${winnersStr}${messageUrl ? `\n${messageUrl}` : ""}
		
		**Options**:
		${endStr}
		${activeStr}
		${publishedStr}
		${lockEntriesStr}
		${numberOfWinnersStr}
		${minimumAccountAgeStr}
		${requiredRolesStr}
		${pingRolesStr} ${pingRolesWarning ? `\n\n${pingRolesWarning}` : ""}

		Giveaway ${idStr} (${absoluteIdStr}) • ${lastEditStr}
	`;
	}

	public toEmbed() {
		const winnerQuantityStr = `→ Number of winners: ${this.winnerQuantity}`;

		const requiredRolesStr = `→ Roles required to enter: ${
			this.requiredRolesIds.length
				? listify(
						this.requiredRolesIds.map((roleId) => `<@&${roleId}>`),
						{ length: 10 }
				  )
				: "None"
		}`;

		const minimumAccountAgeStr = `→ Minimum account age: ${
			this.minimumAccountAge
				? ms(Number(this.minimumAccountAge), { long: true })
				: "None"
		}`;

		const endStr = this.endTimestamp
			? `→ The giveaway will end: ${longStamp(this.endTimestamp)}`
			: "→ The giveaway has no set end date. Enter while you can!";

		const prizesStr = this.prizes.length
			? this.prizes.map((prize) => prize.toShortString()).join("\n")
			: `There are no set prizes. Maybe it is a secret? ${EMOJIS.SHUSH}`;

		const descriptionStr = stripIndents`
			${this.description ? `${this.description}\n\n` : ""}
			**Info**
			${winnerQuantityStr}
			${endStr}
			${requiredRolesStr}
			${minimumAccountAgeStr}

			**Prizes**
			${prizesStr}
		`;

		return new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(descriptionStr)
			.setColor("#2d7d46")
			.setFooter({
				text: `Giveaway #${id} • Hosted by ${this.hostUserTag}`
			});
	}

	public async edit(data: Prisma.GiveawayDataUpdateInput) {
		return await this.manager.edit({
			data,
			where: {
				id: this.id
			}
		});
	}
}
