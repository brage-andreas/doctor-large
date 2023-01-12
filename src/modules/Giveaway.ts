import { type Prisma } from "@prisma/client";
import { oneLine, source, stripIndents } from "common-tags";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type Client,
	type Guild,
	type GuildMember,
	type GuildTextBasedChannel,
	type MessageEditOptions
} from "discord.js";
import ms from "ms";
import { COLORS, EMOJIS } from "../constants.js";
import { default as GiveawayManager } from "../database/giveaway.js";
import { listify } from "../helpers/listify.js";
import s from "../helpers/s.js";
import { longStamp } from "../helpers/timestamps.js";
import { type GiveawayDataWithIncludes } from "../typings/database.js";
import Prize from "./Prize.js";

export default class Giveaway {
	public readonly manager: GiveawayManager;
	public client: Client<true>;
	public data: GiveawayDataWithIncludes;
	public guild: Guild;

	// -- Raw data --
	public active: boolean;
	public channelId: string | null;
	public description: string | null;
	public endTimestamp: string | null;
	public entriesLocked: boolean;
	public guildId: string;
	public guildRelativeId: number;
	public hostUserId: string;
	public hostUserTag: string;
	public id: number;
	public lastEditedUserId: string | null;
	public lastEditedUserTag: string | null;
	public minimumAccountAge: string | null;
	public publishedMessageId: string | null;
	public title: string;
	public winnerMessageId: string | null;
	public winnerQuantity: number;
	// --------------

	// -- Manipulated data --
	public createdTimestamp: number;
	public lastEditedTimestamp: number | null;
	public entriesUserIds: Set<string>;
	public pingRolesIds: Set<string>;
	public prizes: Array<Prize>;
	public requiredRolesIds: Set<string>;
	// ----------------------

	private _prizesQuantity: number | null = null;
	private _winnersUserIds: Set<string> | null = null;

	public constructor(data: GiveawayDataWithIncludes, guild: Guild) {
		this.client = guild.client;
		this.guild = guild;
		this.data = data;

		this.manager = new GiveawayManager(guild);

		// -- Raw data --
		this.publishedMessageId = data.publishedMessageId;
		this.lastEditedUserTag = data.lastEditedUserTag;
		this.minimumAccountAge = data.minimumAccountAge;
		this.lastEditedUserId = data.lastEditedUserId;
		this.winnerMessageId = data.winnerMessageId;
		this.guildRelativeId = data.guildRelativeId;
		this.winnerQuantity = data.winnerQuantity;
		this.entriesLocked = data.entriesLocked;
		this.endTimestamp = data.endTimestamp;
		this.description = data.description;
		this.hostUserTag = data.hostUserTag;
		this.hostUserId = data.hostUserId;
		this.channelId = data.channelId;
		this.guildId = data.guildId;
		this.active = data.active;
		this.title = data.title;
		this.id = data.id;
		// --------------

		// -- Manipulated data --
		this.createdTimestamp = Number(data.createdTimestamp);
		this.requiredRolesIds = new Set(data.requiredRolesIds);
		this.entriesUserIds = new Set(data.entriesUserIds);
		this.pingRolesIds = new Set(data.pingRolesIds);

		this.lastEditedTimestamp = data.lastEditedTimestamp
			? Number(data.lastEditedTimestamp)
			: null;

		this.prizes = data.prizes.map(
			(prize) => new Prize({ ...prize, giveaway: this }, guild)
		);
		// ----------------------
	}

	public get pingRolesMentions() {
		if (!this.pingRolesIds.size) {
			return undefined;
		}

		return [...this.pingRolesIds].map((id) => `<@&${id}>`);
	}

	public get requiredRolesMentions() {
		if (!this.requiredRolesIds.size) {
			return undefined;
		}

		return [...this.requiredRolesIds].map((id) => `<@&${id}>`);
	}

	public get channel(): GuildTextBasedChannel | null {
		const channel = this.channelId
			? this.guild.channels.cache.get(this.channelId)
			: undefined;

		return channel?.isTextBased() ? channel : null;
	}

	public get publishedMessageURL(): string | null {
		const gId = this.guildId;
		const cId = this.channelId;
		const mId = this.publishedMessageId;

		if (!cId || !mId) {
			return null;
		}

		return `https://discord.com/channels/${gId}/${cId}/${mId}`;
	}

	public get winnerMessageURL(): string | null {
		const gId = this.guildId;
		const cId = this.channelId;
		const mId = this.winnerMessageId;

		if (!cId || !mId) {
			return null;
		}

		return `https://discord.com/channels/${gId}/${cId}/${mId}`;
	}

	public get publishedMessage() {
		return this._editMessage(this.publishedMessageId);
	}

	public get winnerMessage() {
		return this._editMessage(this.winnerMessageId);
	}

	public async reset(filter: {
		entriesAndWinners?: boolean;
		prizes?: boolean;
		options?: boolean;
	}): Promise<void> {
		const resetAll = async () => {
			await this.publishedMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data);
			await this.manager.deletePrizes(this.data);

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					channelId: null,
					endTimestamp: null,
					entriesLocked: false,
					entriesUserIds: [],
					minimumAccountAge: null,
					pingRolesIds: [],
					publishedMessageId: null,
					requiredRolesIds: [],
					winnerMessageId: null
				}
			});
		};

		const resetEntriesAndWinners = async () => {
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data);

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					entriesUserIds: []
				}
			});
		};

		const resetOptions = async () => {
			await this.publishedMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					channelId: null,
					endTimestamp: null,
					entriesLocked: false,
					minimumAccountAge: null,
					pingRolesIds: [],
					publishedMessageId: null,
					requiredRolesIds: [],
					winnerMessageId: null
				}
			});
		};

		const resetPrizes = async () => {
			await this.publishedMessage?.delete();

			await this.manager.deletePrizes(this.data);
		};

		const { entriesAndWinners, prizes, options } = filter;

		if (entriesAndWinners && prizes && options) {
			await resetAll();

			return;
		}

		if (entriesAndWinners) {
			await resetEntriesAndWinners();
		}

		if (options) {
			await resetOptions();
		}

		if (prizes) {
			await resetPrizes();
		}
	}

	public isEdited(): this is this & {
		lastEditedTimestamp: number;
		lastEditedUserId: string;
		lastEditedUserTag: string;
	} {
		return (
			Boolean(this.lastEditedTimestamp) &&
			Boolean(this.lastEditedUserId) &&
			Boolean(this.lastEditedUserTag)
		);
	}

	public prizesQuantity(forceRefresh?: boolean) {
		if (this._prizesQuantity === null || forceRefresh) {
			this._prizesQuantity = this.prizes.reduce(
				(acc, prize) => acc + prize.quantity,
				0
			);
		}

		return this._prizesQuantity;
	}

	public prizesOf(userId: string) {
		return this.prizes.filter((prize) => prize.winners.has(userId));
	}

	public winnersUserIds(forceRefresh?: boolean) {
		if (this._winnersUserIds === null || forceRefresh) {
			this._winnersUserIds = this.prizes.reduce((set, e) => {
				e.winners.forEach((winner) => set.add(winner.userId));

				return set;
			}, new Set<string>());
		}

		return this._winnersUserIds;
	}

	public isPublished(): this is this & { publishedMessageId: string } {
		return Boolean(this.publishedMessageId);
	}

	public winnersArePublished(): this is this & { winnerMessageId: string } {
		return Boolean(this.winnerMessageId);
	}

	public hasRequiredRoles(member: GuildMember) {
		if (!this.requiredRolesIds.size) {
			return true;
		}

		const roleIds = [...this.requiredRolesIds];

		return roleIds.every((roleId) => member.roles.cache.has(roleId));
	}

	public isOldEnough(member: GuildMember) {
		const minimumAccountAge = Number(this.minimumAccountAge);

		const accountAge = Date.now() - member.user.createdTimestamp;

		if (minimumAccountAge && accountAge < minimumAccountAge) {
			return false;
		}

		return true;
	}

	/**
	 * Deletes all winners and prizes tied to the giveaway, and the giveaway itself.
	 * Optional: Delete published messages, including the winner announcement.
	 */
	public async delete(options: { withPublishedMessages: boolean }) {
		const { withPublishedMessages } = options;

		if (withPublishedMessages) {
			const channel = this.channel;

			if (channel) {
				await this.publishedMessage?.delete();
				await this.winnerMessage?.delete();
			}
		}

		await this.manager.deleteWinners(this.data);
		await this.manager.deletePrizes(this.data);
		await this.manager.delete(this.id);
	}

	public toShortString() {
		const winners = s("winner", this.winnerQuantity);

		return oneLine`
			#${this.guildRelativeId} **${this.title}** - ${this.winnerQuantity} ${winners},
			${this.prizesQuantity()} ${s("prize", this.prizesQuantity())}
		`;
	}

	public toFullString() {
		const winnerStr = `${this.winnerQuantity || "No"} ${s(
			"winner",
			this.winnerQuantity
		)}`;

		const prizesStr = `${this.prizesQuantity() || "no"} ${s(
			"prize",
			this.prizesQuantity()
		)}`;

		const entriesStr = `${this.entriesUserIds.size || "No"} ${s(
			"entrant",
			this.entriesUserIds.size
		)}`;

		const { active } = this;

		return source`
			#${this.guildRelativeId} "${this.title}"
			${!active ? "  → Inactive\n" : ""}  → ${entriesStr}
			  → ${winnerStr}, ${prizesStr}
		`;
	}

	public toDashboardOverview() {
		const requiredRolesStr = this.requiredRolesIds.size
			? `→ Required roles (${this.requiredRolesIds.size}): ${listify(
					this.requiredRolesMentions!,
					{ length: 5 }
			  )}`
			: "→ Required roles: None";

		const minimumAccountAgeStr = `→ Minimum account age: ${
			this.minimumAccountAge
				? ms(Number(this.minimumAccountAge), { long: true })
				: "None"
		}`;

		const pingRolesStr = this.pingRolesIds.size
			? `→ Ping roles (${this.pingRolesIds.size}): ${listify(
					this.pingRolesMentions!,
					{ length: 10 }
			  )}`
			: "→ Ping roles: None";

		const badPingRoles = [...this.pingRolesIds].filter((roleId) => {
			const mentionable = this.guild.roles.cache.get(roleId)?.mentionable;
			const canMentionAll = this.guild.members.me?.permissions.has(
				PermissionFlagsBits.MentionEveryone
			);

			return !mentionable && !canMentionAll;
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

		const rolesStr = stripIndents`
			${requiredRolesStr}
			${pingRolesStr}
			
			${pingRolesWarning ?? ""}
		`;

		const endStr = this.endTimestamp
			? `→ End date: ${longStamp(this.endTimestamp)}`
			: `→ End date: ${EMOJIS.WARN} No set end date.`;

		const prizesName = this.prizes.length
			? `Prizes (${this.prizesQuantity()})`
			: "Prizes";

		const prizesStr = this.prizes.length
			? this.prizes.map((prize) => prize.toShortString()).join("\n")
			: `${EMOJIS.WARN} No set prizes`;

		const descriptionStr =
			this.description ?? `${EMOJIS.WARN} There is no set description`;

		const idStr = `#${this.guildRelativeId}`;
		const absoluteIdStr = `#${this.id}`;
		const numberOfWinnersStr = `→ Number of winners: ${this.winnerQuantity}`;
		const hostStr = `→ Host: ${this.hostUserTag} (${this.hostUserId})`;
		const activeStr = `→ Active: ${this.active ? "Yes" : "No"}`;
		const entriesStr = `→ Entries: ${this.entriesUserIds.size}`;
		const createdStr = `→ Created: ${longStamp(this.createdTimestamp)}`;

		const lockEntriesStr = `→ Entries locked: ${
			this.entriesLocked ? "Yes" : "No"
		}`;

		const publishedStr = `→ Published: ${
			this.isPublished() ? "Yes" : "No"
		}`;

		const rawMessageUrl = this.publishedMessageURL;
		const messageUrl = rawMessageUrl
			? `→ [Link to giveaway](<${rawMessageUrl}>)`
			: null;

		const winnersStr = this.winnersUserIds().size
			? oneLine`
				→ Winners (${this.winnersUserIds().size}/${this.winnerQuantity}):
				${[...this.winnersUserIds()].map((id) => `<@${id}> (${id})`).join(", ")}
			`
			: "→ No winners";

		const lastEditStr = this.isEdited()
			? oneLine`
				Last edited by:
				${this.lastEditedUserTag}
				(${this.lastEditedUserId})
			`
			: "No edits";

		const infoField = stripIndents`
			${hostStr}
			${createdStr}
			${entriesStr}
			${winnersStr}${messageUrl ? `\n${messageUrl}` : ""}
		`;

		const optionsField = stripIndents`
			${endStr}
			${activeStr}
			${publishedStr}
			${lockEntriesStr}
			${numberOfWinnersStr}
			${minimumAccountAgeStr}
		`;

		const embed = new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(descriptionStr)
			.setFooter({
				text: `Giveaway ${idStr} (${absoluteIdStr}) • ${lastEditStr}`
			})
			.setTimestamp(this.isEdited() ? this.lastEditedTimestamp : null)
			.setColor(
				// published = green
				// active = yellow
				// inactive = red
				this.isPublished()
					? COLORS.GREEN
					: this.active
					? COLORS.YELLOW
					: COLORS.RED
			)
			.setFields(
				{
					name: prizesName,
					value: prizesStr
				},
				{
					name: "Roles",
					value: rolesStr
				},
				{
					name: "Options",
					value: optionsField,
					inline: true
				},
				{
					name: "Info",
					value: infoField,
					inline: true
				}
			);

		return {
			embeds: [embed]
		};
	}

	public toEmbed() {
		const winnerQuantityStr = `→ Number of winners: ${this.winnerQuantity}`;

		const requiredRolesStr = `→ Roles required to enter: ${
			this.requiredRolesIds.size
				? listify(this.requiredRolesMentions!, { length: 10 })
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
			.setColor(COLORS.GREEN)
			.setFooter({
				text: `Giveaway #${this.guildRelativeId} • Hosted by ${this.hostUserTag}`
			});
	}

	public endedEmbed() {
		const winners = this.winnersUserIds();

		const data = this.prizes
			.flatMap((prize) =>
				[...prize.winners.values()].map(
					(winner) =>
						`→ <@${winner.userId}> won **${winner.quantityWon}x ${prize.name}**`
				)
			)
			.join("\n");

		const embed = new EmbedBuilder()
			.setColor(COLORS.GREEN)
			.setTitle(
				`${EMOJIS.TADA} Giveaway #${this.guildRelativeId} has ended!`
			)
			.setFooter({
				text: `Giveaway #${this.guildRelativeId} • Hosted by ${this.hostUserTag}`
			});

		if (winners.size) {
			embed.setDescription(stripIndents`
					The winners are: ${listify(
						[...winners].map((userId) => `<@${userId}>`),
						{ length: winners.size }
					)}
		
					${data}
		
					Congratulations!
				`);
		} else {
			embed.setDescription(stripIndents`
					There were no winners.
		
					Uh.. congratulations!
				`);
		}

		return embed;
	}

	public async edit(data: Prisma.GiveawayDataUpdateInput) {
		return await this.manager.edit({
			data,
			where: {
				id: this.id
			}
		});
	}

	private _editMessage(messageId: string | null) {
		if (!this.channelId || !messageId) {
			return null;
		}

		const channel = this.channel;

		if (!channel) {
			return null;
		}

		return {
			fetch: async () =>
				await channel.messages.fetch(messageId).catch(() => null),
			delete: async () =>
				await channel.messages.delete(messageId).catch(() => null),
			edit: async (data: MessageEditOptions) =>
				await channel.messages.edit(messageId, data).catch(() => null)
		};
	}
}
