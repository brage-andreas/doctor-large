import {
	ChannelType,
	ComponentType,
	type APIChannelSelectComponent,
	type APIRoleSelectComponent
} from "discord.js";

export const role = {
	customId: "roleSelect",
	component: (
		{ min, max }: { min: number; max: number } = { min: 1, max: 10 }
	): APIRoleSelectComponent => ({
		custom_id: "roleSelect",
		min_values: min,
		max_values: max,
		type: ComponentType.RoleSelect
	})
} as const;

export const channel = {
	customId: "channelSelect",
	component: ({
		channelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement],
		max = 1,
		min = 1
	}: {
		channelTypes?: Array<ChannelType>;
		max?: number;
		min?: number;
	} = {}): APIChannelSelectComponent => ({
		channel_types: channelTypes,
		custom_id: "channelSelect",
		max_values: max,
		min_values: min,
		type: ComponentType.ChannelSelect
	})
} as const;
