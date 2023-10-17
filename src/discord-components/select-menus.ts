import { type APIChannelSelectComponent, type APIRoleSelectComponent, ChannelType, ComponentType } from "discord.js";

export const role = {
	component: (options?: { max: number; min: number }): APIRoleSelectComponent => ({
		custom_id: "roleSelect",
		max_values: options?.max ?? 10,
		min_values: options?.min ?? 1,
		type: ComponentType.RoleSelect,
	}),
	customId: "roleSelect",
} as const;

export const channel = {
	component: ({
		channelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement],
		max = 1,
		min = 1,
	}: {
		channelTypes?: Array<ChannelType>;
		max?: number;
		min?: number;
	} = {}): APIChannelSelectComponent => ({
		channel_types: channelTypes,
		custom_id: "channelSelect",
		max_values: max,
		min_values: min,
		type: ComponentType.ChannelSelect,
	}),
	customId: "channelSelect",
} as const;
