import {
	type Client,
	EmbedBuilder,
	type Guild,
	type GuildMember,
	type GuildTextBasedChannel,
	type MessageCreateOptions,
	type MessageEditOptions,
	PermissionFlagsBits,
	type Role,
	bold,
	hideLinkEmbed,
	hyperlink,
} from "discord.js";
import {
	type CountPrizeWinner,
	type GiveawayId,
	type GiveawayWithIncludes,
	type PrizeId,
	type Snowflake,
	type WinnerId,
} from "#typings";
import { type Giveaway, type HostNotified, type Prisma, type Winner } from "@prisma/client";
import { commandMention, getTag, listify, longstamp, messageURL, s } from "#helpers";
import { default as GiveawayManager } from "#database/giveaway.js";
import { oneLine, stripIndent, stripIndents } from "common-tags";
import { Colors, Emojis } from "#constants";
import components from "#components";
import PrizeModule from "./prize.js";
import ms from "ms";
type ModifiedGiveaway = Omit<Giveaway, "entriesUserIds" | "pingRolesIds" | "requiredRolesIds">;

export default class GiveawayModule implements ModifiedGiveaway {
	private _prizesQuantity: null | number = null;
	private _winnersUserIds: Set<string> | null = null;
	public announcementMessageId: null | string;
	public announcementMessageUpdated: boolean;
	public asRelId: `#${number}`;
	public channelId: null | string;
	public readonly client: Client<true>;
	public createdAt: Date;
	public data: GiveawayWithIncludes;
	public description: string;
	public endAutomation;
	public endDate: Date | null;
	public ended: boolean;
	public entriesLocked: boolean;
	public entriesUserIds: Set<Snowflake>;
	public readonly guild: Guild;
	public guildId: string;
	public guildRelativeId: number;
	public host: string;
	public hostNotified: HostNotified;
	public hostUserId: string;
	public hostUsername: string;
	public id: GiveawayId;
	public lastEditedAt: Date;
	public readonly manager: GiveawayManager;
	public minimumAccountAge: null | string;
	public pingRoles: Array<Role>;
	public pingRolesIds: Set<Snowflake>;
	public prizes: Array<PrizeModule>;
	public requiredRoles: Array<Role>;
	public requiredRolesIds: Set<Snowflake>;
	public title: string;
	public winnerMessageId: null | string;
	public winnerMessageUpdated: boolean;
	public winnerQuantity: number;
	public winners: Array<Winner & { prize: PrizeModule }>;

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
		this.hostUsername = data.hostUsername;
		this.description = data.description;
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
			.filter(Boolean) as Array<Role>;

		this.requiredRoles = data.requiredRolesIds
			.map((roleId) => guild.roles.cache.get(roleId))
			.filter(Boolean) as Array<Role>;

		this.prizes = data.prizes.map((prize) => new PrizeModule({ ...prize, giveaway: this }, guild));

		this.winners = this.prizes.reduce<Array<Winner & { prize: PrizeModule }>>(
			(winners, prize) => [...winners, ...prize.winners.map((w) => ({ ...w, prize }))],
			[]
		);
		// ----------------------

		// -- Props --
		this.asRelId = `#${this.guildRelativeId}`;
		this.host = getTag({ id: this.hostUserId, tag: this.hostUsername });
		// -----------
	}

	private _editMessage(messageId: null | string) {
		if (!this.channelId || !messageId) {
			return null;
		}

		const channel = this.channel;

		if (!channel) {
			return null;
		}

		return {
			delete: async () => await channel.messages.delete(messageId).catch(() => null),
			edit: async (data: MessageEditOptions) => await channel.messages.edit(messageId, data).catch(() => null),
			fetch: async () => await channel.messages.fetch(messageId).catch(() => null),
			reply: async (data: Omit<MessageCreateOptions, "reply">) =>
				await channel
					.send({
						...data,
						reply: {
							failIfNotExists: false,
							messageReference: messageId,
						},
					})
					.catch(() => null),
		};
	}

	public cannotEndContent() {
		const missingParts: Array<string> = [];

		if (!this.prizesQuantity()) {
			missingParts.push("* Add one or more prizes");
		}

		if (!this.channelId) {
			missingParts.push("* Announce the giveaway");
		}

		if (missingParts.length === 0) {
			return "";
		}

		return stripIndents`
			${Emojis.Error} The giveaway cannot be ended:
			${missingParts.join("\n")}
		`;
	}

	/**
	 * Deletes all winners and prizes tied to the giveaway, and the giveaway itself.
	 * Optional: Delete announced messages, including the winner announcement.
	 */
	public async delete({ withAnnouncementMessages }: { withAnnouncementMessages: boolean }) {
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

	public async dmWinners(options: {
		includeNotified: boolean;
		winners?: Array<{ id: WinnerId; userId: Snowflake }>;
	}) {
		const winners = options.winners?.map((winner) => ({ ...winner, notified: false })) ?? this.winners;

		if (winners.length === 0) {
			return;
		}

		const myGiveaways = await commandMention("my-giveaways", this.client);

		const alreadyNotified = new Set<string>();
		const ids: Array<WinnerId> = [];

		for (const { id, notified, userId } of winners) {
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
							url: this.winnerMessageURL,
					  })
					: null
			);

			void this.client.users
				.send(userId, { components: rows, content })
				.catch(() => null)
				.then(() => null);
		}

		await this.manager.prisma.winner.updateMany({
			data: {
				notified: true,
			},
			where: {
				id: { in: ids },
			},
		});
	}

	public async edit(
		data: Prisma.GiveawayUpdateInput & {
			nowOutdated: {
				announcementMessage?: boolean;
				none?: boolean;
				winnerMessage?: boolean;
			};
		}
	) {
		const { nowOutdated, ...data_ } = data;

		if (nowOutdated.none || (!nowOutdated.announcementMessage && !nowOutdated.winnerMessage)) {
			return await this.manager.edit({
				data: data_,
				where: { id: this.id },
			});
		}

		const announcementMessageUpdated =
			this.isAnnounced() || data.announcementMessageId ? nowOutdated.announcementMessage : undefined;

		const winnerMessageUpdated =
			this.winnersAreAnnounced() || data.winnerMessageId ? nowOutdated.winnerMessage : undefined;

		return await this.manager.edit({
			data: {
				announcementMessageUpdated,
				winnerMessageUpdated,
				...data_,
			},
			where: { id: this.id },
		});
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
				text: `Giveaway ${this.asRelId} • Hosted by ${this.host}`,
			}).setDescription(stripIndents`
			${Emojis.StarEyes} The winners have been notified in DMs.
			If you have DMs turned off, use ${myGiveawaysMention}.

			Congratulations, everyone! ${Emojis.Tada}
		`);

		return {
			allowedMentions: { parse: ["everyone", "roles"] },
			content: this.pingRolesMentions?.join(" "),
			embeds: [embed],
		};
	}

	public isAnnounced(): this is this & { announcementMessageId: string } {
		return Boolean(this.announcementMessageId);
	}

	public isOldEnough(member: GuildMember) {
		const minimumAccountAge = Number(this.minimumAccountAge);

		const accountAge = Date.now() - member.user.createdTimestamp;

		if (minimumAccountAge && accountAge < minimumAccountAge) {
			return false;
		}

		return true;
	}

	public memberHasRequiredRoles(member: GuildMember) {
		if (!this.hasRequiredRoles) {
			return true;
		}

		const roleIds = [...this.requiredRolesIds];

		return roleIds.every((roleId) => member.roles.cache.has(roleId));
	}

	/**
	 * Mapped by prize ID
	 */
	public prizesOf(userId: string) {
		if (!this.winnersUserIds().has(userId)) {
			return null;
		}

		const prizesBundled = this.winners.reduce<{
			claimed: Map<PrizeId, CountPrizeWinner>;
			unclaimed: Map<PrizeId, CountPrizeWinner>;
		}>(
			(prizes, winner) => {
				if (winner.userId !== userId) {
					return prizes;
				}

				const { claimed, prize, prizeId } = winner;
				let newPrizes: {
					claimed: Map<number, CountPrizeWinner>;
					unclaimed: Map<number, CountPrizeWinner>;
				} = { claimed: new Map(), unclaimed: new Map() };

				const oldClaimed: CountPrizeWinner = prizes.claimed.get(prizeId) ?? { count: 0, prize, winner };

				const oldUnclaimed: CountPrizeWinner = prizes.unclaimed.get(prizeId) ?? { count: 0, prize, winner };

				if (claimed) {
					const newClaimed = prizes.claimed.set(prizeId, {
						count: oldClaimed.count + 1,
						prize,
						winner,
					});

					newPrizes = {
						claimed: newClaimed,
						unclaimed: prizes.unclaimed,
					};
				} else {
					const newUnclaimed = prizes.unclaimed.set(prizeId, {
						count: oldUnclaimed.count + 1,
						prize,
						winner,
					});

					newPrizes = {
						claimed: prizes.claimed,
						unclaimed: newUnclaimed,
					};
				}

				return newPrizes;
			},
			{ claimed: new Map(), unclaimed: new Map() }
		);

		return prizesBundled;
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

		for (const id of this.winnersUserIds()) {
			const prizes = this.prizesOf(id);

			if (!prizes) {
				continue;
			}

			map.set(id, {
				claimed: [...prizes.claimed.values()],
				unclaimed: [...prizes.unclaimed.values()],
			});
		}

		if (map.size === 0) {
			return null;
		}

		return map;
	}

	public prizesQuantity(forceRefresh?: boolean) {
		if (this._prizesQuantity === null || forceRefresh) {
			this._prizesQuantity = this.prizes.reduce((accumulator, prize) => accumulator + prize.quantity, 0);
		}

		return this._prizesQuantity;
	}

	public async reset(filter: {
		all?: boolean;
		entriesAndWinners?: boolean;
		options?: boolean;
		prizesAndWinners?: boolean;
		winners?: boolean;
	}): Promise<void> {
		// eslint-disable-next-line unicorn/consistent-function-scoping
		const resetAll = async () => {
			await this.announcementMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data).then(async () => {
				await this.manager.deletePrizes(this.data);
			});

			await this.manager.edit({
				data: {
					announcementMessageId: null,
					announcementMessageUpdated: false,
					channelId: null,
					endAutomation: "End",
					endDate: null,
					entriesLocked: false,
					entriesUserIds: [],
					minimumAccountAge: null,
					pingRolesIds: [],
					requiredRolesIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false,
				},
				where: {
					id: this.id,
				},
			});
		};

		// eslint-disable-next-line unicorn/consistent-function-scoping
		const resetEntriesAndWinners = async () => {
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data);

			await this.manager.edit({
				data: {
					entriesUserIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false,
				},
				where: {
					id: this.id,
				},
			});
		};

		// eslint-disable-next-line unicorn/consistent-function-scoping
		const resetOptions = async () => {
			await this.announcementMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.edit({
				data: {
					announcementMessageId: null,
					announcementMessageUpdated: false,
					channelId: null,
					endAutomation: "End",
					endDate: null,
					entriesLocked: false,
					minimumAccountAge: null,
					pingRolesIds: [],
					requiredRolesIds: [],
					winnerMessageId: null,
					winnerMessageUpdated: false,
				},
				where: {
					id: this.id,
				},
			});
		};

		// eslint-disable-next-line unicorn/consistent-function-scoping
		const resetPrizesAndWinners = async () => {
			await this.announcementMessage?.delete();
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data).then(async () => {
				await this.manager.deletePrizes(this.data);
			});

			await this.manager.edit({
				data: {
					announcementMessageId: null,
					announcementMessageUpdated: false,
					winnerMessageId: null,
					winnerMessageUpdated: false,
				},
				where: {
					id: this.id,
				},
			});
		};

		// eslint-disable-next-line unicorn/consistent-function-scoping
		const resetWinners = async () => {
			await this.winnerMessage?.delete();

			await this.manager.deleteWinners(this.data);

			await this.manager.edit({
				data: {
					winnerMessageId: null,
					winnerMessageUpdated: false,
				},
				where: {
					id: this.id,
				},
			});
		};

		const { all, entriesAndWinners, options, prizesAndWinners, winners } = filter;

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

	public toDashboardOverview() {
		const requiredRolesString =
			this.requiredRolesIds.size > 0 && this.requiredRolesMentions?.length
				? `* Required roles (${this.requiredRolesIds.size}): ${listify(this.requiredRolesMentions, {
						length: 5,
				  })}`
				: "* Required roles: None";

		const minimumAccountAgeString = `* Minimum account age: ${
			this.minimumAccountAge ? ms(Number(this.minimumAccountAge), { long: true }) : "None"
		}`;

		const pingRolesString =
			this.hasPingRoles && this.pingRolesMentions?.length
				? `* Ping roles (${this.pingRolesIds.size}): ${listify(this.pingRolesMentions, { length: 10 })}`
				: "* Ping roles: None";

		const badPingRoles = [...this.pingRolesIds].filter((roleId) => {
			const mentionable = this.guild.roles.cache.get(roleId)?.mentionable;
			const canMentionAll = this.guild.members.me?.permissions.has(PermissionFlagsBits.MentionEveryone);

			return !mentionable && !canMentionAll;
		});

		const pingRolesWarning =
			badPingRoles.length > 0
				? oneLine`
			${Emojis.Warn} Missing permissions to ping roles (${badPingRoles.length}):
			${listify(
				badPingRoles.map((roleId) => `<@&${roleId}>`),
				{ length: 10 }
			)}
		`
				: null;

		const rolesString = stripIndents`
			${requiredRolesString}
			${pingRolesString}
			
			${pingRolesWarning ?? ""}
		`;

		const endString = this.endDate
			? `* End date: ${longstamp(this.endDate)}`
			: `* End date: ${Emojis.Warn} No set end date.`;

		const prizesName = this.prizes.length > 0 ? `Prizes (${this.prizesQuantity()})` : "Prizes";

		const prizesString =
			this.prizes.length > 0
				? this.prizes.map((prize) => prize.toShortString()).join("\n")
				: `${Emojis.Warn} No set prizes`;

		const createdString = `* Created: ${longstamp(this.createdAt)}`;
		const entriesString = `* Entries: ${this.entriesUserIds.size}`;
		const hostString = `* Host: ${this.host} (${this.hostUserId})`;
		const numberOfWinnersString = `* Number of winners: ${this.winnerQuantity}`;

		const endedString = `* Ended: ${this.ended ? `${Emojis.Ended} Yes` : "No"}`;

		const lockEntriesString = `* Entries locked: ${this.entriesLocked ? `${Emojis.Lock} Yes` : "No"}`;

		const announcedString = `* Announced: ${this.isAnnounced() ? "Yes" : "No"}`;

		const rawMessageUrl = this.announcementMessageURL;
		const messageUrl = rawMessageUrl
			? `* ${hyperlink("Link to announcement", hideLinkEmbed(rawMessageUrl))}`
			: null;

		const winnersString =
			this.winnersUserIds().size > 0
				? `* Unique winners: ${bold(this.winnersUserIds().size.toString())}/${this.winnerQuantity}`
				: `* ${this.entriesUserIds.size > 0 ? `${Emojis.Warn} ` : ""}No winners`;

		const announcementOutdated = this.announcementMessageIsOutdated
			? `${Emojis.Warn} The giveaway announcement is outdated. Reannounce the giveaway.`
			: "";

		const winnerOutdated = this.winnerMessageIsOutdated
			? `${Emojis.Warn} The winner announcement is outdated. Reannounce the winners.`
			: "";

		const infoField = stripIndents`
			${hostString}
			${createdString}
			${entriesString}
			${winnersString}${messageUrl ? `\n${messageUrl}` : ""}
		`;

		const optionsField = stripIndents`
			${endedString}
			${lockEntriesString}
			${announcedString}
			${endString}
			${numberOfWinnersString}
			${minimumAccountAgeString}
		`;

		const embed = new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(this.description)
			.setFooter({
				text: `Giveaway ${this.asRelId} • Last edited`,
			})
			.setTimestamp(this.lastEditedAt)
			.setColor(this.isAnnounced() ? Colors.Green : this.ended ? Colors.Red : Colors.Yellow)
			.setFields(
				{
					name: prizesName,
					value: prizesString,
				},
				{
					name: "Roles",
					value: rolesString,
				},
				{
					inline: true,
					name: "Options",
					value: optionsField,
				},
				{
					inline: true,
					name: "Info",
					value: infoField,
				}
			);

		return {
			content: [this.cannotEndContent(), announcementOutdated, winnerOutdated].join("\n\n") || undefined,
			embeds: [embed],
		};
	}

	public toEmbed() {
		const winnerQuantityString = `* Number of winners: ${this.winnerQuantity}`;

		const requiredRolesString = `* Roles required to enter: ${
			this.requiredRolesIds.size > 0 && this.requiredRolesMentions?.length
				? listify(this.requiredRolesMentions, { length: 10 })
				: "None"
		}`;

		const minimumAccountAgeString = `* Minimum account age: ${
			this.minimumAccountAge ? ms(Number(this.minimumAccountAge), { long: true }) : "None"
		}`;

		const endString = this.endDate
			? `* The giveaway will end: ${longstamp(this.endDate)}`
			: "* The giveaway has no set end date. Enter while you can!";

		const prizesString =
			this.prizes.length > 0
				? this.prizes.map((prize) => prize.toShortString()).join("\n")
				: `There are no set prizes. Maybe it is a secret? ${Emojis.Shush}`;

		return new EmbedBuilder()
			.setTitle(this.title)
			.setDescription(this.description)
			.setColor(Colors.Green)
			.setFooter({
				text: `Giveaway ${this.asRelId} • Hosted by ${this.host}`,
			})
			.setFields(
				{
					name: "Info",
					value: stripIndents`
					${winnerQuantityString}
					${endString}
					${requiredRolesString}
					${minimumAccountAgeString}
				`,
				},
				{
					name: "Prizes",
					value: prizesString,
				}
			);
	}

	public toFullString(options?: { userId: Snowflake }) {
		const id = options?.userId;

		const isEntry = Boolean(id && this.entriesUserIds.has(id));
		const isWinner = Boolean(id && this.winnersUserIds().has(id));

		const entries = this.entriesUserIds.size || "None";
		const prizes = this.prizesQuantity() || "None";
		const winners = this.winnerQuantity || "None";

		return stripIndents`
			### ${this.asRelId} ${this.ended ? "[ENDED] " : ""}${this.title}
			* Entries: ${entries}${isEntry ? " <-- You" : ""}
			* Winners: ${winners}${isWinner ? " <-- You" : ""}
			* Prizes: ${prizes}
		`;
	}

	public toShortString() {
		const winners = s("winner", this.winnerQuantity);

		return oneLine`
			${this.asRelId} ${bold(this.title)} - ${this.winnerQuantity} ${winners},
			${this.prizesQuantity()} ${s("prize", this.prizesQuantity())}
		`;
	}

	public winnersAreAnnounced(): this is this & { winnerMessageId: string } {
		return Boolean(this.winnerMessageId);
	}

	public winnersUserIds(forceRefresh?: boolean) {
		if (this._winnersUserIds === null || forceRefresh) {
			this._winnersUserIds = new Set(this.winners.map((w) => w.userId));
		}

		return this._winnersUserIds;
	}

	public get announcementMessage() {
		return this._editMessage(this.announcementMessageId);
	}

	public get announcementMessageIsOutdated() {
		if (!this.announcementMessageId) {
			return false;
		}

		return !this.announcementMessageUpdated;
	}

	public get announcementMessageURL(): null | string {
		if (!this.channelId || !this.announcementMessageId) {
			return null;
		}

		return messageURL(this.guildId, this.channelId, this.announcementMessageId);
	}

	public get channel(): GuildTextBasedChannel | null {
		const channel = this.channelId ? this.guild.channels.cache.get(this.channelId) : undefined;

		return channel?.isTextBased() ? channel : null;
	}

	public get hasPingRoles() {
		return this.pingRolesIds.size > 0;
	}

	public get hasRequiredRoles() {
		return this.requiredRolesIds.size > 0;
	}

	public get pingRolesMentions() {
		if (!this.hasPingRoles) {
			return undefined;
		}

		return this.pingRoles.map((role) => role.toString());
	}

	public get requiredRolesMentions() {
		if (!this.hasRequiredRoles) {
			return undefined;
		}

		return this.requiredRoles.map((role) => role.toString());
	}

	public get winnerMessage() {
		return this._editMessage(this.winnerMessageId);
	}

	public get winnerMessageIsOutdated() {
		if (!this.winnerMessageId) {
			return false;
		}

		return !this.winnerMessageUpdated;
	}

	public get winnerMessageURL(): null | string {
		if (!this.channelId || !this.winnerMessageId) {
			return null;
		}

		return messageURL(this.guildId, this.channelId, this.winnerMessageId);
	}
}
