import { type HostNotified, type Prisma } from "@prisma/client";
import { oneLine, source, stripIndents } from "common-tags";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type Client,
	type Guild,
	type GuildMember,
	type GuildTextBasedChannel,
	type MessageCreateOptions,
	type MessageEditOptions,
	type Role
} from "discord.js";
import ms from "ms";
import { COLORS, EMOJIS } from "../constants.js";
import { default as GiveawayManager } from "../database/giveaway.js";
import { listify } from "../helpers/listify.js";
import s from "../helpers/s.js";
import { longStamp } from "../helpers/timestamps.js";
import { type GiveawayWithIncludes } from "../typings/database.js";
import PrizeModule from "./Prize.js";

export default class GiveawayModule {
	public data: GiveawayWithIncludes;
	public readonly client: Client<true>;
	public readonly guild: Guild;
	public readonly manager: GiveawayManager;

	// -- Raw data --
	public channelId: string | null;
	public createdAt: Date;
	public description: string;
	public endAutomation;
	public endDate: Date | null;
	public ended: boolean;
	public entriesLocked: boolean;
	public guildId: string;
	public guildRelativeId: number;
	public hostNotified: HostNotified;
	public hostUserId: string;
	public hostUserTag: string;
	public id: number;
	public lastEditedAt: Date | null;
	public minimumAccountAge: string | null;
	public publishedMessageId: string | null;
	public publishedMessageUpdated: boolean;
	public title: string;
	public winnerMessageId: string | null;
	public winnerMessageUpdated: boolean;
	public winnerQuantity: number;
	// --------------

	// -- Manipulated data --
	public entriesUserIds: Set<string>;
	public pingRolesIds: Set<string>;
	public prizes: Array<PrizeModule>;
	public requiredRolesIds: Set<string>;
	// ----------------------

	// -- Cache --
	public pingRoles: Array<Role>;
	public requiredRoles: Array<Role>;
	private _prizesQuantity: number | null = null;
	private _winnersUserIds: Set<string> | null = null;
	// -----------

	public constructor(data: GiveawayWithIncludes, guild: Guild) {
		this.client = guild.client;
		this.guild = guild;
		this.data = data;

		this.manager = new GiveawayManager(guild);

		// -- Raw data --
		this.publishedMessageUpdated = data.publishedMessageUpdated;
		this.winnerMessageUpdated = data.winnerMessageUpdated;
		this.publishedMessageId = data.publishedMessageId;
		this.minimumAccountAge = data.minimumAccountAge;
		this.guildRelativeId = data.guildRelativeId;
		this.winnerMessageId = data.winnerMessageId;
		this.winnerQuantity = data.winnerQuantity;
		this.endAutomation = data.endAutomation;
		this.entriesLocked = data.entriesLocked;
		this.hostNotified = data.hostNotified;
		this.lastEditedAt = data.lastEditedAt;
		this.description = data.description;
		this.hostUserTag = data.hostUserTag;
		this.hostUserId = data.hostUserId;
		this.channelId = data.channelId;
		this.createdAt = data.createdAt;
		this.endDate = data.endDate;
		this.guildId = data.guildId;
		this.ended = data.ended;
		this.title = data.title;
		this.id = data.id;
		// --------------

		// -- Manipulated data --
		this.requiredRolesIds = new Set(data.requiredRolesIds);
		this.entriesUserIds = new Set(data.entriesUserIds);
		this.pingRolesIds = new Set(data.pingRolesIds);

		this.pingRoles = data.pingRolesIds
			.map((roleId) => guild.roles.cache.get(roleId))
			.filter((roleOrUndefined) =>
				Boolean(roleOrUndefined)
			) as Array<Role>;

		this.requiredRoles = data.requiredRolesIds
			.map((roleId) => guild.roles.cache.get(roleId))
			.filter((roleOrUndefined) =>
				Boolean(roleOrUndefined)
			) as Array<Role>;

		this.prizes = data.prizes.map(
			(prize) => new PrizeModule({ ...prize, giveaway: this }, guild)
		);
		// ----------------------
	}

	public get publishedMessageIsOutdated() {
		return this.publishedMessageUpdated && Boolean(this.publishedMessageId);
	}

	public get winnerMessageIsOutdated() {
		return this.winnerMessageUpdated && Boolean(this.winnerMessageId);
	}

	public get hasPingRoles() {
		return Boolean(this.pingRolesIds.size);
	}

	public get pingRolesMentions() {
		if (!this.hasPingRoles) {
			return undefined;
		}

		return this.pingRoles.map((role) => role.toString());
	}

	public get hasRequiredRoles() {
		return Boolean(this.requiredRolesIds.size);
	}

	public get requiredRolesMentions() {
		if (!this.hasRequiredRoles) {
			return undefined;
		}

		return this.requiredRoles.map((role) => role.toString());
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
		prizesAndWinners?: boolean;
		winners?: boolean;
		options?: boolean;
		all?: boolean;
	}): Promise<void> {
		const resetAll = async () => {
			await this.publishedMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data).then(async () => {
				await this.manager.deletePrizes(this.data);
			});

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					channelId: null,
					endAutomation: "End",
					endDate: null,
					entriesLocked: false,
					entriesUserIds: [],
					minimumAccountAge: null,
					pingRolesIds: [],
					publishedMessageId: null,
					publishedMessageUpdated: false,
					requiredRolesIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false
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
					entriesUserIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false
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
					endAutomation: "End",
					endDate: null,
					entriesLocked: false,
					minimumAccountAge: null,
					pingRolesIds: [],
					publishedMessageId: null,
					publishedMessageUpdated: false,
					requiredRolesIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false
				}
			});
		};

		const resetPrizesAndWinners = async () => {
			await this.publishedMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data).then(async () => {
				await this.manager.deletePrizes(this.data);
			});

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					publishedMessageId: null,
					publishedMessageUpdated: false,
					winnerMessageId: null,
					winnerMessageUpdated: false
				}
			});
		};

		const resetWinners = async () => {
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data);

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					winnerMessageId: null,
					winnerMessageUpdated: false
				}
			});
		};

		const { entriesAndWinners, prizesAndWinners, winners, options, all } =
			filter;

		if (all) {
			await resetAll();

			return;
		}

		if (entriesAndWinners) {
			await resetEntriesAndWinners();
		}

		if (options) {
			await resetOptions();
		}

		if (prizesAndWinners) {
			await resetPrizesAndWinners();
		}

		if (winners) {
			await resetWinners();
		}
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
		if (!this.winnersUserIds().has(userId)) {
			return;
		}

		const map = new Map<
			string,
			Array<{ prize: PrizeModule; count: number }>
		>();

		const prizes = this.prizes.filter((prize) =>
			prize.winners.some((winner) => winner.userId === userId)
		);

		prizes.forEach((prize) => {
			const winners = prize.winners.filter((w) => w.userId === userId);

			winners.forEach((winner) => {
				const current = map.get(winner.userId);

				if (!current) {
					map.set(winner.userId, [{ prize, count: 1 }]);

					return;
				}

				const index = current.findIndex(
					(obj) => obj.prize.id === prize.id
				);

				const currentObj = -1 < index && current.at(index);

				if (currentObj) {
					const { prize, count } = currentObj;

					current.splice(index, 1);
					current.push({ prize, count: count + 1 });
				} else {
					current.push({ prize, count: 1 });
				}

				map.set(winner.userId, current);
			});
		});

		return map;
	}

	public winnersUserIds(forceRefresh?: boolean) {
		if (this._winnersUserIds === null || forceRefresh) {
			this._winnersUserIds = this.prizes.reduce((set, { winners }) => {
				[...winners].forEach((winner) => set.add(winner.userId));

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

	public memberHasRequiredRoles(member: GuildMember) {
		if (!this.hasRequiredRoles) {
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

		const { ended } = this;

		return source`
			#${this.guildRelativeId} "${this.title}"
			${ended ? "  → Ended\n" : ""}  → ${entriesStr}
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

		const pingRolesStr = this.hasPingRoles
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

		const endStr = this.endDate
			? `→ End date: ${longStamp(this.endDate)}`
			: `→ End date: ${EMOJIS.WARN} No set end date.`;

		const prizesName = this.prizes.length
			? `Prizes (${this.prizesQuantity()})`
			: "Prizes";

		const prizesStr = this.prizes.length
			? this.prizes.map((prize) => prize.toShortString()).join("\n")
			: `${EMOJIS.WARN} No set prizes`;

		const descriptionStr =
			this.description ?? `${EMOJIS.WARN} There is no set description`;

		const createdStr = `→ Created: ${longStamp(this.createdAt)}`;
		const entriesStr = `→ Entries: ${this.entriesUserIds.size}`;
		const hostStr = `→ Host: ${this.hostUserTag} (${this.hostUserId})`;
		const idStr = `#${this.guildRelativeId}`;
		const numberOfWinnersStr = `→ Number of winners: ${this.winnerQuantity}`;

		const endedStr = `→ Ended: ${
			this.ended ? `${EMOJIS.ENDED} Yes` : "No"
		}`;

		const lockEntriesStr = `→ Entries locked: ${
			this.entriesLocked ? `${EMOJIS.LOCK} Yes` : "No"
		}`;

		const publishedStr = `→ Published: ${
			this.isPublished() ? "Yes" : "No"
		}`;

		const rawMessageUrl = this.publishedMessageURL;
		const messageUrl = rawMessageUrl
			? `→ [Link to giveaway](<${rawMessageUrl}>)`
			: null;

		const winnersStr = this.winnersUserIds().size
			? `→ Unique winners: **${this.winnersUserIds().size}**/${
					this.winnerQuantity
			  }`
			: `→ ${
					this.entriesUserIds.size ? `${EMOJIS.WARN} ` : ""
			  }No winners`;

		const publishedOutdated = this.publishedMessageIsOutdated
			? `${EMOJIS.WARN} The published message is outdated. Republish the giveaway.`
			: "";

		const winnerOutdated = this.winnerMessageIsOutdated
			? `${EMOJIS.WARN} The winner announcement is outdated. Republish the winners.`
			: "";

		const missingParts: Array<string> = [];

		if (!this.prizesQuantity()) {
			missingParts.push("Add one or more prizes");
		}

		if (!this.channelId) {
			missingParts.push("Publish the giveaway");
		}

		const cannotEnd =
			!this.prizesQuantity() || this.channelId
				? source`
					${EMOJIS.ERROR} The giveaway cannot be ended:
					  → ${missingParts.join("\n→ ")}
				`
				: "";

		const infoField = stripIndents`
			${hostStr}
			${createdStr}
			${entriesStr}
			${winnersStr}${messageUrl ? `\n${messageUrl}` : ""}
		`;

		const optionsField = stripIndents`
			${endedStr}
			${lockEntriesStr}
			${publishedStr}
			${endStr}
			${numberOfWinnersStr}
			${minimumAccountAgeStr}
		`;

		const embed = new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(descriptionStr)
			.setFooter({
				text: `Giveaway ${idStr} • Last edited`
			})
			.setTimestamp(this.lastEditedAt)
			.setColor(
				// published = green
				// active = yellow
				// ended = red
				this.isPublished()
					? COLORS.GREEN
					: this.ended
					? COLORS.RED
					: COLORS.YELLOW
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
			content:
				[cannotEnd, publishedOutdated, winnerOutdated].join("\n\n") ||
				undefined,
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

		const endStr = this.endDate
			? `→ The giveaway will end: ${longStamp(this.endDate)}`
			: "→ The giveaway has no set end date. Enter while you can!";

		const prizesStr = this.prizes.length
			? this.prizes.map((prize) => prize.toShortString()).join("\n")
			: `There are no set prizes. Maybe it is a secret? ${EMOJIS.SHUSH}`;

		return new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(this.description)
			.setColor(COLORS.GREEN)
			.setFooter({
				text: `Giveaway #${this.guildRelativeId} • Hosted by ${this.hostUserTag}`
			})
			.setFields(
				{
					name: "Info",
					value: stripIndents`
					${winnerQuantityStr}
					${endStr}
					${requiredRolesStr}
					${minimumAccountAgeStr}
				`
				},
				{
					name: "Prizes",
					value: prizesStr
				}
			);
	}

	public endedEmbed(): Partial<MessageCreateOptions> {
		const myGiveawaysCommand = this.client.application.commands.cache.find(
			(command) => command.name === "my-giveaways"
		);

		const myGiveawaysMention = myGiveawaysCommand
			? `</my-giveaways:${myGiveawaysCommand.id}>`
			: "the /my-giveaways command";

		const embed = new EmbedBuilder()
			.setColor(COLORS.GREEN)
			.setTitle(
				`${EMOJIS.TADA} Giveaway #${this.guildRelativeId} has ended!`
			)
			.setFooter({
				text: `Giveaway #${this.guildRelativeId} • Hosted by ${this.hostUserTag}`
			}).setDescription(stripIndents`
			${EMOJIS.STAR_EYES} The winners have been notified in DMs.
			If you have DMs turned off, use ${myGiveawaysMention}.

			Congratulations, everyone! ${EMOJIS.TADA}
		`);

		return {
			embeds: [embed],
			content: this.pingRolesMentions?.join(" "),
			allowedMentions: { parse: ["everyone", "roles"] }
		};
	}

	public async edit(
		data: Prisma.GiveawayUpdateInput & {
			nowOutdated: {
				none?: boolean;
				publishedMessage?: boolean;
				winnerMessage?: boolean;
			};
		}
	) {
		const { nowOutdated } = data;

		if (
			nowOutdated.none ||
			(!nowOutdated.none &&
				!nowOutdated.publishedMessage &&
				!nowOutdated.winnerMessage)
		) {
			return await this.manager.edit({
				where: { id: this.id },
				data
			});
		}

		const publishedMessageUpdated =
			this.isPublished() || data.publishedMessageId
				? nowOutdated.publishedMessage
				: undefined;

		const winnerMessageUpdated =
			this.winnersArePublished() || data.winnerMessageId
				? nowOutdated.winnerMessage
				: undefined;

		return await this.manager.edit({
			where: { id: this.id },
			data: {
				publishedMessageUpdated,
				winnerMessageUpdated,
				...data
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
