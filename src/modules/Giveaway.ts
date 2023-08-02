import components from "#components";
import { Colors, Emojis } from "#constants";
import { default as GiveawayManager } from "#database/giveaway.js";
import commandMention from "#helpers/commandMention.js";
import { listify } from "#helpers/listify.js";
import { messageURL } from "#helpers/messageHelpers.js";
import s from "#helpers/s.js";
import { longstamp } from "#helpers/timestamps.js";
import {
	type CountPrizeWinner,
	type GiveawayId,
	type GiveawayWithIncludes,
	type PrizeId,
	type Snowflake,
	type WinnerId
} from "#typings";
import {
	type Giveaway,
	type HostNotified,
	type Prisma,
	type Winner
} from "@prisma/client";
import { oneLine, stripIndent, stripIndents } from "common-tags";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	bold,
	hideLinkEmbed,
	hyperlink,
	type Client,
	type Guild,
	type GuildMember,
	type GuildTextBasedChannel,
	type MessageCreateOptions,
	type MessageEditOptions,
	type Role
} from "discord.js";
import ms from "ms";
import PrizeModule from "./Prize.js";

type ModifiedGiveaway = Omit<
	Giveaway,
	"entriesUserIds" | "pingRolesIds" | "requiredRolesIds"
>;

export default class GiveawayModule implements ModifiedGiveaway {
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
	public id: GiveawayId;
	public lastEditedAt: Date;
	public minimumAccountAge: string | null;
	public announcementMessageId: string | null;
	public announcementMessageUpdated: boolean;
	public title: string;
	public winnerMessageId: string | null;
	public winnerMessageUpdated: boolean;
	public winnerQuantity: number;
	// --------------

	// -- Manipulated data --
	public entriesUserIds: Set<Snowflake>;
	public pingRolesIds: Set<Snowflake>;
	public prizes: Array<PrizeModule>;
	public requiredRolesIds: Set<Snowflake>;
	public winners: Array<Winner & { prize: PrizeModule }>;
	// ----------------------

	// -- Props --
	public asRelId: `#${number}`;
	// -----------

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
		this.announcementMessageUpdated = data.announcementMessageUpdated;
		this.winnerMessageUpdated = data.winnerMessageUpdated;
		this.announcementMessageId = data.announcementMessageId;
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

		this.winners = this.prizes.reduce(
			(winners, prize) => [
				...winners,
				...prize.winners.map((w) => ({ ...w, prize }))
			],
			[] as Array<Winner & { prize: PrizeModule }>
		);
		// ----------------------

		// -- Props --
		this.asRelId = `#${this.guildRelativeId}`;
		// -----------
	}

	public get announcementMessageIsOutdated() {
		if (!this.announcementMessageId) {
			return false;
		}

		return !this.announcementMessageUpdated;
	}

	public get winnerMessageIsOutdated() {
		if (!this.winnerMessageId) {
			return false;
		}

		return !this.winnerMessageUpdated;
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

	public get announcementMessageURL(): string | null {
		if (!this.channelId || !this.announcementMessageId) {
			return null;
		}

		return messageURL(
			this.guildId,
			this.channelId,
			this.announcementMessageId
		);
	}

	public get winnerMessageURL(): string | null {
		if (!this.channelId || !this.winnerMessageId) {
			return null;
		}

		return messageURL(this.guildId, this.channelId, this.winnerMessageId);
	}

	public get announcementMessage() {
		return this._editMessage(this.announcementMessageId);
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
			await this.announcementMessage?.delete();
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
					announcementMessageId: null,
					announcementMessageUpdated: false,
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
			await this.announcementMessage?.delete();
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
					announcementMessageId: null,
					announcementMessageUpdated: false,
					requiredRolesIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false
				}
			});
		};

		const resetPrizesAndWinners = async () => {
			await this.announcementMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data).then(async () => {
				await this.manager.deletePrizes(this.data);
			});

			await this.manager.edit({
				where: {
					id: this.id
				},
				data: {
					announcementMessageId: null,
					announcementMessageUpdated: false,
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

	/**
	 * Mapped by user id
	 */
	public prizesOfAllWinners() {
		const map = new Map<
			Snowflake,
			{
				claimed: Array<CountPrizeWinner>;
				unclaimed: Array<CountPrizeWinner>;
			}
		>();

		this.winnersUserIds().forEach((id) => {
			const prizes = this.prizesOf(id);

			if (!prizes) {
				return;
			}

			map.set(id, {
				claimed: [...prizes.claimed.values()],
				unclaimed: [...prizes.unclaimed.values()]
			});
		});

		if (!map.size) {
			return null;
		}

		return map;
	}

	/**
	 * Mapped by prize ID
	 */
	public prizesOf(userId: string) {
		if (!this.winnersUserIds().has(userId)) {
			return null;
		}

		const prizesBundled = this.winners.reduce(
			(prizes, winner) => {
				if (winner.userId !== userId) {
					return prizes;
				}

				const { prize, prizeId, claimed } = winner;
				let newPrizes: {
					claimed: Map<number, CountPrizeWinner>;
					unclaimed: Map<number, CountPrizeWinner>;
				} = { claimed: new Map(), unclaimed: new Map() };

				const oldClaimed: CountPrizeWinner = prizes.claimed.get(
					prizeId
				) ?? { prize, winner, count: 0 };

				const oldUnclaimed: CountPrizeWinner = prizes.unclaimed.get(
					prizeId
				) ?? { prize, winner, count: 0 };

				if (claimed) {
					const newClaimed = prizes.claimed.set(prizeId, {
						prize,
						winner,
						count: oldClaimed.count + 1
					});

					newPrizes = {
						unclaimed: prizes.unclaimed,
						claimed: newClaimed
					};
				} else {
					const newUnclaimed = prizes.unclaimed.set(prizeId, {
						prize,
						winner,
						count: oldUnclaimed.count + 1
					});

					newPrizes = {
						unclaimed: newUnclaimed,
						claimed: prizes.claimed
					};
				}

				return newPrizes;
			},
			{ claimed: new Map(), unclaimed: new Map() } as {
				claimed: Map<PrizeId, CountPrizeWinner>;
				unclaimed: Map<PrizeId, CountPrizeWinner>;
			}
		);

		return prizesBundled;
	}

	public winnersUserIds(forceRefresh?: boolean) {
		if (this._winnersUserIds === null || forceRefresh) {
			this._winnersUserIds = new Set(this.winners.map((w) => w.userId));
		}

		return this._winnersUserIds;
	}

	public isAnnounced(): this is this & { announcementMessageId: string } {
		return Boolean(this.announcementMessageId);
	}

	public winnersAreAnnounced(): this is this & { winnerMessageId: string } {
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
	 * Optional: Delete announced messages, including the winner announcement.
	 */
	public async delete({
		withAnnouncementMessages
	}: {
		withAnnouncementMessages: boolean;
	}) {
		if (withAnnouncementMessages) {
			const channel = this.channel;

			if (channel) {
				await this.announcementMessage?.delete();
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
			${this.asRelId} ${bold(this.title)} - ${this.winnerQuantity} ${winners},
			${this.prizesQuantity()} ${s("prize", this.prizesQuantity())}
		`;
	}

	public toFullString(options?: { userId: Snowflake }) {
		const id = options?.userId;
		const { ended } = this;

		const isEntry = Boolean(id && this.entriesUserIds.has(id));
		const isWinner = Boolean(id && this.winnersUserIds().has(id));

		const entries = this.entriesUserIds.size || "None";
		const prizes = this.prizesQuantity() || "None";
		const winners = this.winnerQuantity || "None";

		return stripIndents`
			### ${this.asRelId} ${ended ? "[ENDED] " : ""}${this.title}
			* Entries: ${entries}${isEntry ? " <-- You" : ""}
			* Winners: ${winners}${isWinner ? " <-- You" : ""}
			* Prizes: ${prizes}
		`;
	}

	public cannotEndContent() {
		const missingParts: Array<string> = [];

		if (!this.prizesQuantity()) {
			missingParts.push("* Add one or more prizes");
		}

		if (!this.channelId) {
			missingParts.push("* Announce the giveaway");
		}

		if (!missingParts.length) {
			return "";
		}

		return stripIndents`
			${Emojis.Error} The giveaway cannot be ended:
			${missingParts.join("\n")}
		`;
	}

	public toDashboardOverview() {
		const requiredRolesStr =
			this.requiredRolesIds.size && this.requiredRolesMentions?.length
				? `* Required roles (${this.requiredRolesIds.size}): ${listify(
						this.requiredRolesMentions,
						{ length: 5 }
				  )}`
				: "* Required roles: None";

		const minimumAccountAgeStr = `* Minimum account age: ${
			this.minimumAccountAge
				? ms(Number(this.minimumAccountAge), { long: true })
				: "None"
		}`;

		const pingRolesStr =
			this.hasPingRoles && this.pingRolesMentions?.length
				? `* Ping roles (${this.pingRolesIds.size}): ${listify(
						this.pingRolesMentions,
						{ length: 10 }
				  )}`
				: "* Ping roles: None";

		const badPingRoles = [...this.pingRolesIds].filter((roleId) => {
			const mentionable = this.guild.roles.cache.get(roleId)?.mentionable;
			const canMentionAll = this.guild.members.me?.permissions.has(
				PermissionFlagsBits.MentionEveryone
			);

			return !mentionable && !canMentionAll;
		});

		const pingRolesWarning = badPingRoles.length
			? oneLine`
			${Emojis.Warn} Missing permissions to ping roles (${badPingRoles.length}):
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
			? `* End date: ${longstamp(this.endDate)}`
			: `* End date: ${Emojis.Warn} No set end date.`;

		const prizesName = this.prizes.length
			? `Prizes (${this.prizesQuantity()})`
			: "Prizes";

		const prizesStr = this.prizes.length
			? this.prizes.map((prize) => prize.toShortString()).join("\n")
			: `${Emojis.Warn} No set prizes`;

		const createdStr = `* Created: ${longstamp(this.createdAt)}`;
		const entriesStr = `* Entries: ${this.entriesUserIds.size}`;
		const hostStr = `* Host: ${this.hostUserTag} (${this.hostUserId})`;
		const numberOfWinnersStr = `* Number of winners: ${this.winnerQuantity}`;

		const endedStr = `* Ended: ${
			this.ended ? `${Emojis.Ended} Yes` : "No"
		}`;

		const lockEntriesStr = `* Entries locked: ${
			this.entriesLocked ? `${Emojis.Lock} Yes` : "No"
		}`;

		const announcedStr = `* Announced: ${
			this.isAnnounced() ? "Yes" : "No"
		}`;

		const rawMessageUrl = this.announcementMessageURL;
		const messageUrl = rawMessageUrl
			? `* ${hyperlink(
					"Link to announcement",
					hideLinkEmbed(rawMessageUrl)
			  )}`
			: null;

		const winnersStr = this.winnersUserIds().size
			? `* Unique winners: ${bold(
					this.winnersUserIds().size.toString()
			  )}/${this.winnerQuantity}`
			: `* ${
					this.entriesUserIds.size ? `${Emojis.Warn} ` : ""
			  }No winners`;

		const announcementOutdated = this.announcementMessageIsOutdated
			? `${Emojis.Warn} The giveaway announcement is outdated. Reannounce the giveaway.`
			: "";

		const winnerOutdated = this.winnerMessageIsOutdated
			? `${Emojis.Warn} The winner announcement is outdated. Reannounce the winners.`
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
			${announcedStr}
			${endStr}
			${numberOfWinnersStr}
			${minimumAccountAgeStr}
		`;

		const embed = new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(this.description)
			.setFooter({
				text: `Giveaway ${this.asRelId} • Last edited`
			})
			.setTimestamp(this.lastEditedAt)
			.setColor(
				this.isAnnounced()
					? Colors.Green
					: this.ended
					? Colors.Red
					: Colors.Yellow
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
				[
					this.cannotEndContent(),
					announcementOutdated,
					winnerOutdated
				].join("\n\n") || undefined,
			embeds: [embed]
		};
	}

	public toEmbed() {
		const winnerQuantityStr = `* Number of winners: ${this.winnerQuantity}`;

		const requiredRolesStr = `* Roles required to enter: ${
			this.requiredRolesIds.size && this.requiredRolesMentions?.length
				? listify(this.requiredRolesMentions, { length: 10 })
				: "None"
		}`;

		const minimumAccountAgeStr = `* Minimum account age: ${
			this.minimumAccountAge
				? ms(Number(this.minimumAccountAge), { long: true })
				: "None"
		}`;

		const endStr = this.endDate
			? `* The giveaway will end: ${longstamp(this.endDate)}`
			: "* The giveaway has no set end date. Enter while you can!";

		const prizesStr = this.prizes.length
			? this.prizes.map((prize) => prize.toShortString()).join("\n")
			: `There are no set prizes. Maybe it is a secret? ${Emojis.Shush}`;

		return new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(this.description)
			.setColor(Colors.Green)
			.setFooter({
				text: `Giveaway ${this.asRelId} • Hosted by ${this.hostUserTag}`
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
			.setColor(Colors.Green)
			.setTitle(`${Emojis.Tada} Giveaway ${this.asRelId} has ended!`)
			.setFooter({
				text: `Giveaway ${this.asRelId} • Hosted by ${this.hostUserTag}`
			}).setDescription(stripIndents`
			${Emojis.StarEyes} The winners have been notified in DMs.
			If you have DMs turned off, use ${myGiveawaysMention}.

			Congratulations, everyone! ${Emojis.Tada}
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
				announcementMessage?: boolean;
				winnerMessage?: boolean;
			};
		}
	) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { nowOutdated, ...data_ } = data;

		if (
			nowOutdated.none ||
			(!nowOutdated.announcementMessage && !nowOutdated.winnerMessage)
		) {
			return await this.manager.edit({
				where: { id: this.id },
				data: data_
			});
		}

		const announcementMessageUpdated =
			this.isAnnounced() || data.announcementMessageId
				? nowOutdated.announcementMessage
				: undefined;

		const winnerMessageUpdated =
			this.winnersAreAnnounced() || data.winnerMessageId
				? nowOutdated.winnerMessage
				: undefined;

		return await this.manager.edit({
			where: { id: this.id },
			data: {
				announcementMessageUpdated,
				winnerMessageUpdated,
				...data_
			}
		});
	}

	public async dmWinners(options: {
		includeNotified: boolean;
		winners?: Array<{ id: WinnerId; userId: Snowflake }>;
	}) {
		const winners =
			options.winners?.map((e) => ({ ...e, notified: false })) ??
			this.winners;

		if (!winners.length) {
			return;
		}

		const myGiveaways = await commandMention("my-giveaways", this.client);

		const alreadyNotified = new Set<string>();
		const ids: Array<WinnerId> = [];

		for (const { userId, notified, id } of winners) {
			if (!options.includeNotified && notified) {
				continue;
			}

			ids.push(id);

			if (alreadyNotified.has(userId)) {
				continue;
			}

			alreadyNotified.add(userId);

			if (notified) {
				continue;
			}

			ids.push(id);

			const content = stripIndent`
				# You just won a giveaway! ${Emojis.Tada}
				* ${this.title} • ${this.asRelId} • ${this.guild.name}.

				Make sure to ${bold("claim your prize(s)")}!

				## How to claim your prizes
				* Use ${myGiveaways} in the server and claim your prizes.
				* Click the "${Emojis.StarEyes} Accept Prize" button in the announcement.

				GG!
			`;

			const rows = components.createRows(
				this.winnerMessageURL
					? components.buttons.url({
							label: "Go to announcement",
							url: this.winnerMessageURL
					  })
					: null
			);

			this.client.users
				.send(userId, { content, components: rows })
				.catch(() => null)
				.then(() => null);
		}

		await this.manager.prisma.winner.updateMany({
			where: {
				id: { in: ids }
			},
			data: {
				notified: true
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
				await channel.messages.edit(messageId, data).catch(() => null),
			reply: async (data: Omit<MessageCreateOptions, "reply">) =>
				await channel
					.send({
						...data,
						reply: {
							messageReference: messageId,
							failIfNotExists: false
						}
					})
					.catch(() => null)
		};
	}
}
