import {
	type Channel,
	type ChannelResolvable,
	ChannelType,
	type Client,
	EmbedBuilder,
	type EmbedField,
	type ForumChannel,
	type Guild,
	type GuildTextBasedChannel,
	PermissionFlagsBits,
	type Role,
} from "discord.js";
import { type MessageReportModule, type UserReportModule } from "./Report.js";
import type ConfigManager from "#database/config.js";
import ReportManager from "#database/report.js";
import { type Config } from "@prisma/client";
import { Colors, Emojis } from "#constants";

function channel(guild: Guild, id: null | string, allowForum?: false | undefined): GuildTextBasedChannel | undefined;
function channel(guild: Guild, id: null | string, allowForum: true): ForumChannel | GuildTextBasedChannel | undefined;

function channel(
	guild: Guild,
	id: null | string,
	allowForum?: boolean | undefined
): ForumChannel | GuildTextBasedChannel | undefined {
	if (!id) {
		return undefined;
	}

	const ch = guild.channels.cache.get(id);

	if (!ch?.isDMBased() && ch?.isTextBased()) {
		return ch;
	}

	if (allowForum && ch?.type === ChannelType.GuildForum) {
		return ch;
	}

	return undefined;
}

export default class ConfigModule implements Omit<Config, "protectedChannelsIds" | "restrictRolesIds"> {
	public caseLogChannel?: GuildTextBasedChannel;
	public caseLogChannelId: null | string;
	public caseLogEnabled: boolean;
	public readonly client: Client<true>;

	public data: Config;
	public readonly guild: Guild;
	public guildId: string;
	public lastEditedAt: Date;
	public readonly manager: ConfigManager;
	public memberLogChannel?: GuildTextBasedChannel;
	public memberLogChannelId: null | string;
	public memberLogEnabled: boolean;
	public messageLogChannel?: GuildTextBasedChannel;
	public messageLogChannelId: null | string;
	public messageLogEnabled: boolean;
	public pinArchiveChannel?: GuildTextBasedChannel;
	public pinArchiveChannelId: null | string;
	public protectedChannels: Array<GuildTextBasedChannel>;
	public protectedChannelsIds: Set<string>;
	public reportChannel?: ForumChannel | GuildTextBasedChannel;
	public reportChannelId: null | string;
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
		this.protectedChannels = data.protectedChannelsIds.reduce<Array<GuildTextBasedChannel>>((array, channelId) => {
			const ch = channel(guild, channelId);

			if (ch) {
				array.push(ch);
			}

			return array;
		}, []);

		this.restrictRolesIds = new Set(data.restrictRolesIds);
		this.restrictRoles = data.restrictRolesIds.reduce<Array<Role>>((array, roleId) => {
			const role = guild.roles.cache.get(roleId);

			if (role) {
				array.push(role);
			}

			return array;
		}, []);
	}

	public static getTypeFromChannel(channel: Channel): string;
	public static getTypeFromChannel(channel: Channel | null | undefined): null | string;
	public static getTypeFromChannel(channel: Channel | null | undefined): null | string {
		const typeString =
			channel &&
			ChannelType[channel.type]
				.replace("Guild", "")
				.split(/(?=[A-Z])/)
				.join(" ");

		return typeString ? typeString.charAt(0).toUpperCase() + typeString.slice(1) : null;
	}

	public createMemberLog() {
		// TODO
	}

	public async edit(...data: Parameters<ConfigManager["update"]>) {
		return await this.manager.update(data[0]);
	}

	public editCaseLog() {
		// TODO
	}

	public isProtectedChannel(channel: ChannelResolvable) {
		const id = typeof channel === "string" ? channel : channel.id;

		return this.protectedChannelsIds.has(id);
	}

	public postCaseLog() {
		// TODO
	}

	public postMessageLog() {
		// TODO
	}

	public async postReport(reportOrReportId: MessageReportModule | UserReportModule | number) {
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
			const reportOrNullish = await reportManager.get(reportOrReportId);

			if (!reportOrNullish) {
				return false;
			}

			report = reportOrNullish;
		}

		const message = await report.generatePost();

		if (!this.reportChannel.isTextBased()) {
			const thread = await this.reportChannel.threads
				.create({
					message,
					name: `Report #${report.guildRelativeId} - ${report.target}`,
				})
				.catch(() => null);

			if (!thread) {
				return false;
			}

			await report.manager.edit({
				data: {
					logChannelId: thread.id,
					logMessageId: thread.id,
				},
				where: {
					id: report.id,
				},
			});

			return true;
		}

		const message_ = await this.reportChannel.send({ ...message, embeds: [] }).catch(() => null);

		if (!message_) {
			return false;
		}

		await report.manager.edit({
			data: {
				logChannelId: this.reportChannelId,
				logMessageId: message_.id,
			},
			where: {
				id: report.id,
			},
		});

		return true;
	}

	public removeCaseLog() {
		// TODO
	}

	public setProtectedChannels() {
		// TODO
	}

	public toEmbed() {
		const me = this.guild.members.me;

		const isMissingPermissions = (channel: ForumChannel | GuildTextBasedChannel | undefined) => {
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
						PermissionFlagsBits.EmbedLinks,
					])
			) {
				return `\n${Emojis.Error} Missing permissions`;
			}

			return "";
		};

		const channelString = (
			enabled: boolean,
			channel: ForumChannel | GuildTextBasedChannel | undefined,
			channelId: null | string,
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

			let string = `${Emojis.On} ${channel.toString()}`;

			if (recommendForum && channel.type !== ChannelType.GuildForum) {
				string += "\nForum channel is recommended.\n";
			}

			return `${string}${isMissingPermissions(channel)}`;
		};

		const protectedChannels = this.data.protectedChannelsIds.length || "No";
		const restrictRoles = this.data.restrictRolesIds.length || "No";

		const hasManagesRoles = me?.permissions.has(PermissionFlagsBits.ManageRoles) ?? null;

		let hasManagesRolesString = "";

		if (hasManagesRoles === null) {
			hasManagesRolesString += `\n${Emojis.Warn} Unable to check permissions`;
		} else if (!hasManagesRoles) {
			hasManagesRolesString += `\n${Emojis.Error} Missing permissions`;
		}

		const fields: Array<EmbedField> = [
			{
				inline: true,
				name: "Case log",
				value: channelString(this.caseLogEnabled, this.caseLogChannel, this.data.caseLogChannelId),
			},
			{
				inline: true,
				name: "Restriction roles",
				value: `${restrictRoles} roles${hasManagesRolesString}`,
			},
			{
				inline: true,
				name: "឵឵",
				value: "឵឵",
			},
			{
				inline: true,
				name: "Member log",
				value: channelString(this.memberLogEnabled, this.memberLogChannel, this.data.memberLogChannelId),
			},
			{
				inline: true,
				name: "Pin archive channel",
				value: this.pinArchiveChannel
					? `${this.pinArchiveChannel.toString()}${isMissingPermissions(this.pinArchiveChannel)}`
					: "None",
			},
			{
				inline: true,
				name: "឵឵",
				value: "឵឵",
			},

			{
				inline: true,
				name: "Message log",
				value: channelString(this.messageLogEnabled, this.messageLogChannel, this.data.messageLogChannelId),
			},
			{
				inline: true,
				name: "Protected channels",
				value: `${protectedChannels} channels`,
			},
			{
				inline: true,
				name: "឵឵",
				value: "឵឵",
			},

			{
				inline: true,
				name: "Report",
				value: channelString(this.reportEnabled, this.reportChannel, this.data.reportChannelId, true),
			},
		];

		return new EmbedBuilder()
			.setTitle("Config")
			.setFields(fields)
			.setColor(Colors.Green)
			.setFooter({ text: `${this.guild.name} • Last edited` })
			.setTimestamp(this.lastEditedAt);
	}
}
