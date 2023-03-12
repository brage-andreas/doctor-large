import { Colors, Emojis } from "#constants";
import type ConfigManager from "#database/config.js";
import { type Config } from "@prisma/client";
import { source } from "common-tags";
import {
	ChannelType,
	EmbedBuilder,
	type Channel,
	type ChannelResolvable,
	type Client,
	type EmbedField,
	type ForumChannel,
	type Guild,
	type GuildTextBasedChannel,
	type Role
} from "discord.js";

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

	public createCaseLog() {
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

	public createMessageLog() {
		// TODO
	}

	public createReport() {
		// TODO
	}

	public setProtectedChannels() {
		// TODO
	}

	public async edit(...data: Parameters<ConfigManager["update"]>) {
		return await this.manager.update(data[0]);
	}

	public toEmbed() {
		const channelStr = (
			enabled: boolean,
			channel: ForumChannel | GuildTextBasedChannel | undefined,
			channelId: string | null
		) => {
			if (!enabled) {
				return `${Emojis.Off} Disabled.`;
			}

			if (!channelId) {
				return `${Emojis.On} • ${Emojis.Warn} Channel not set.`;
			}

			if (!channel) {
				return `${Emojis.On} • ${Emojis.Error} Channel not found.`;
			}

			return `${Emojis.On} • ${channel} (\`#${channel.name}\`, \`${channelId}\`)`;
		};

		const pinArchiveStr = this.pinArchiveChannel
			? `${this.pinArchiveChannel} (${this.pinArchiveChannel.id})`
			: "None";

		const threadRecommended =
			!this.reportChannel?.isThread() && this.reportEnabled
				? "\n(Thread channel is recommended)"
				: "";

		const protectedChs = this.data.protectedChannelsIds;
		const protectedChannels = protectedChs.length
			? source`
				${protectedChs
					.map((id) => {
						const channel = this.guild.channels.cache.get(id);
						const type = ConfigModule.getTypeFromChannel(channel);

						return channel
							? `→ ${channel} (${type})`
							: `→ ${Emojis.Warn} Unknown channel \`${id}\``;
					})
					.slice(0, 5)}
				${protectedChs.length > 5 ? `and **${protectedChs.length - 5}** more...` : ""}
			  `
			: "None";

		const restrictRoles_ = this.data.restrictRolesIds;
		const restrictRoles = restrictRoles_.length
			? source`
				${restrictRoles_
					.map((id) => {
						const role = this.guild.roles.cache.get(id);

						return role
							? `→ ${role}`
							: `→ ${Emojis.Warn} Unknown role ${id}`;
					})
					.slice(0, 5)}
				${restrictRoles_.length > 5 ? `and ${restrictRoles_.length - 5} more...` : ""}
			  `
			: "None";

		const fields: Array<EmbedField> = [
			{
				name: "Case log",
				value: `${channelStr(
					this.caseLogEnabled,
					this.caseLogChannel,
					this.data.caseLogChannelId
				)}`,
				inline: false
			},
			{
				name: "Member log",
				value: `${channelStr(
					this.memberLogEnabled,
					this.memberLogChannel,
					this.data.memberLogChannelId
				)}`,
				inline: false
			},
			{
				name: "Message log",
				value: channelStr(
					this.messageLogEnabled,
					this.messageLogChannel,
					this.data.messageLogChannelId
				),
				inline: false
			},
			{
				name: "Report",
				value: `${channelStr(
					this.reportEnabled,
					this.reportChannel,
					this.data.reportChannelId
				)}${threadRecommended}`,
				inline: false
			},

			{
				name: "Pin archive channel",
				value: pinArchiveStr,
				inline: false
			},
			{
				name: `Protected channels (${protectedChs.length})`,
				value: protectedChannels,
				inline: false
			},
			{
				name: `Restriction roles (${restrictRoles_.length})`,
				value: restrictRoles,
				inline: false
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
