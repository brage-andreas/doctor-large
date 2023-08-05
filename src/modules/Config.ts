import { Colors, Emojis } from "#constants";
import type ConfigManager from "#database/config.js";
import ReportManager from "#database/report.js";
import { type Config } from "@prisma/client";
import {
	ChannelType,
	EmbedBuilder,
	PermissionFlagsBits,
	type Channel,
	type ChannelResolvable,
	type Client,
	type EmbedField,
	type ForumChannel,
	type Guild,
	type GuildTextBasedChannel,
	type Role
} from "discord.js";
import { type MessageReportModule, type UserReportModule } from "./Report.js";

function channel(
	guild: Guild,
	id: string | null,
	allowForum?: false | undefined
): GuildTextBasedChannel | undefined;
function channel(
	guild: Guild,
	id: string | null,
	allowForum: true
): ForumChannel | GuildTextBasedChannel | undefined;
function channel(
	guild: Guild,
	id: string | null,
	allowForum?: boolean | undefined
): ForumChannel | GuildTextBasedChannel | undefined {
	if (!id) {
		return undefined;
	}

	const ch = guild.channels.cache.get(id);

	return (!ch?.isDMBased() && ch?.isTextBased()) ||
		(allowForum && ch?.type === ChannelType.GuildForum)
		? ch
		: undefined;
}

export default class ConfigModule
	implements Omit<Config, "protectedChannelsIds" | "restrictRolesIds">
{
	public readonly manager: ConfigManager;
	public readonly client: Client<true>;
	public readonly guild: Guild;
	public data: Config;

	public caseLogChannel?: GuildTextBasedChannel;
	public caseLogChannelId: string | null;
	public caseLogEnabled: boolean;
	public guildId: string;
	public lastEditedAt: Date;
	public memberLogChannel?: GuildTextBasedChannel;
	public memberLogChannelId: string | null;
	public memberLogEnabled: boolean;
	public messageLogChannel?: GuildTextBasedChannel;
	public messageLogChannelId: string | null;
	public messageLogEnabled: boolean;
	public pinArchiveChannel?: GuildTextBasedChannel;
	public pinArchiveChannelId: string | null;
	public protectedChannels: Array<GuildTextBasedChannel>;
	public protectedChannelsIds: Set<string>;
	public reportChannel?: ForumChannel | GuildTextBasedChannel;
	public reportChannelId: string | null;
	public reportEnabled: boolean;
	public restrictRoles: Array<Role>;
	public restrictRolesIds: Set<string>;

	public constructor(data: Config, configManager: ConfigManager) {
		const { guild } = configManager;

		this.manager = configManager;
		this.client = guild.client;
		this.guild = guild;
		this.data = data;

		this.caseLogChannelId = data.caseLogChannelId;
		this.caseLogEnabled = data.caseLogEnabled;
		this.guildId = data.guildId;
		this.lastEditedAt = data.lastEditedAt;
		this.memberLogChannelId = data.memberLogChannelId;
		this.memberLogEnabled = data.memberLogEnabled;
		this.messageLogChannelId = data.messageLogChannelId;
		this.messageLogEnabled = data.messageLogEnabled;
		this.pinArchiveChannelId = data.pinArchiveChannelId;
		this.reportChannelId = data.reportChannelId;
		this.reportEnabled = data.reportEnabled;

		this.caseLogChannel = channel(guild, data.caseLogChannelId);
		this.memberLogChannel = channel(guild, data.memberLogChannelId);
		this.messageLogChannel = channel(guild, data.messageLogChannelId);
		this.pinArchiveChannel = channel(guild, data.pinArchiveChannelId);
		this.reportChannel = channel(guild, data.reportChannelId, true);

		this.protectedChannelsIds = new Set(data.protectedChannelsIds);
		this.protectedChannels = data.protectedChannelsIds.reduce(
			(arr, channelId) => {
				const ch = channel(guild, channelId);

				if (ch) {
					arr.push(ch);
				}

				return arr;
			},
			[] as Array<GuildTextBasedChannel>
		);

		this.restrictRolesIds = new Set(data.restrictRolesIds);
		this.restrictRoles = data.restrictRolesIds.reduce((arr, roleId) => {
			const role = guild.roles.cache.get(roleId);

			if (role) {
				arr.push(role);
			}

			return arr;
		}, [] as Array<Role>);
	}

	public static getTypeFromChannel(channel: Channel): string;
	public static getTypeFromChannel(
		channel: Channel | null | undefined
	): string | null;
	public static getTypeFromChannel(
		channel: Channel | null | undefined
	): string | null {
		const typeString =
			channel &&
			ChannelType[channel.type]
				.replace("Guild", "")
				.split(/(?=[A-Z])/)
				.join(" ");

		return typeString
			? typeString.charAt(0).toUpperCase() + typeString.slice(1)
			: null;
	}

	public isProtectedChannel(channel: ChannelResolvable) {
		const id = typeof channel === "string" ? channel : channel.id;

		return this.protectedChannelsIds.has(id);
	}

	public postCaseLog() {
		// TODO
	}

	public editCaseLog() {
		// TODO
	}

	public removeCaseLog() {
		// TODO
	}

	public createMemberLog() {
		// TODO
	}

	public postMessageLog() {
		// TODO
	}

	public async postReport(
		reportOrReportId: MessageReportModule | UserReportModule | number
	) {
		if (!this.reportEnabled) {
			return false;
		}

		if (!this.reportChannel) {
			return false;
		}

		let report: MessageReportModule | UserReportModule;

		if (typeof reportOrReportId === "object") {
			report = reportOrReportId;
		} else {
			const reportManager = new ReportManager(this.guild);
			const res = await reportManager.get(reportOrReportId);

			if (!res) {
				return false;
			}

			report = res;
		}

		const message = await report.generatePost();

		if (!this.reportChannel.isTextBased()) {
			const thread = await this.reportChannel.threads
				.create({
					message,
					name: `Report #${report.guildRelativeId} - ${report.target}`
				})
				.catch(() => null);

			if (!thread) {
				return false;
			}

			report.manager.edit({
				where: {
					id: report.id
				},
				data: {
					logChannelId: thread.id,
					logMessageId: thread.id
				}
			});

			return true;
		}

		const msg = await this.reportChannel
			.send({ ...message, embeds: [] })
			.catch(() => null);

		if (!msg) {
			return false;
		}

		report.manager.edit({
			where: {
				id: report.id
			},
			data: {
				logChannelId: this.reportChannelId,
				logMessageId: msg.id
			}
		});

		return true;
	}

	public setProtectedChannels() {
		// TODO
	}

	public async edit(...data: Parameters<ConfigManager["update"]>) {
		return await this.manager.update(data[0]);
	}

	public toEmbed() {
		const me = this.guild.members.me;

		const isMissingPermissions = (
			channel: ForumChannel | GuildTextBasedChannel | undefined
		) => {
			if (!channel) {
				return false;
			}

			if (!me) {
				return `\n${Emojis.Warn} Unable to check permissions`;
			}

			if (
				!channel
					.permissionsFor(me)
					.has([
						PermissionFlagsBits.ViewChannel,
						PermissionFlagsBits.SendMessages,
						PermissionFlagsBits.EmbedLinks
					])
			) {
				return `\n${Emojis.Error} Missing permissions`;
			}

			return "";
		};

		const channelStr = (
			enabled: boolean,
			channel: ForumChannel | GuildTextBasedChannel | undefined,
			channelId: string | null,
			recommendForum?: boolean
		) => {
			if (!enabled) {
				return `${Emojis.Off} Disabled`;
			}

			if (!channelId) {
				return `${Emojis.On} • ${Emojis.Warn} Channel not set`;
			}

			if (!channel) {
				return `${Emojis.On} • ${Emojis.Error} Channel not found`;
			}

			let string = `${Emojis.On} ${channel}`;

			if (recommendForum && channel.type !== ChannelType.GuildForum) {
				string += "\nForum channel is recommended.\n";
			}

			return `${string}${isMissingPermissions(channel)}`;
		};

		const protectedChannels = this.data.protectedChannelsIds.length || "No";
		const restrictRoles = this.data.restrictRolesIds.length || "No";

		const hasManagesRoles =
			me?.permissions.has(PermissionFlagsBits.ManageRoles) ?? null;

		let hasManagesRolesStr = "";

		if (hasManagesRoles === null) {
			hasManagesRolesStr += `\n${Emojis.Warn} Unable to check permissions`;
		} else if (!hasManagesRoles) {
			hasManagesRolesStr += `\n${Emojis.Error} Missing permissions`;
		}

		const fields: Array<EmbedField> = [
			{
				name: "Case log",
				value: channelStr(
					this.caseLogEnabled,
					this.caseLogChannel,
					this.data.caseLogChannelId
				),
				inline: true
			},
			{
				name: "Restriction roles",
				value: `${restrictRoles} roles${hasManagesRolesStr}`,
				inline: true
			},
			{
				name: "឵឵",
				value: "឵឵",
				inline: true
			},
			{
				name: "Member log",
				value: channelStr(
					this.memberLogEnabled,
					this.memberLogChannel,
					this.data.memberLogChannelId
				),
				inline: true
			},
			{
				name: "Pin archive channel",
				value: this.pinArchiveChannel
					? `${this.pinArchiveChannel}${isMissingPermissions(
							this.pinArchiveChannel
					  )}`
					: "None",
				inline: true
			},
			{
				name: "឵឵",
				value: "឵឵",
				inline: true
			},

			{
				name: "Message log",
				value: channelStr(
					this.messageLogEnabled,
					this.messageLogChannel,
					this.data.messageLogChannelId
				),
				inline: true
			},
			{
				name: "Protected channels",
				value: `${protectedChannels} channels`,
				inline: true
			},
			{
				name: "឵឵",
				value: "឵឵",
				inline: true
			},

			{
				name: "Report",
				value: channelStr(
					this.reportEnabled,
					this.reportChannel,
					this.data.reportChannelId,
					true
				),
				inline: true
			}
		];

		return new EmbedBuilder()
			.setTitle("Config")
			.setFields(fields)
			.setColor(Colors.Green)
			.setFooter({ text: `${this.guild.name} • Last edited` })
			.setTimestamp(this.lastEditedAt);
	}
}
