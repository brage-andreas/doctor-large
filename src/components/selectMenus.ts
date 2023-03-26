import {
	ChannelSelectMenuBuilder,
	ChannelType,
	RoleSelectMenuBuilder
} from "discord.js";

export const roleSelect = {
	customId: "roleSelect",
	component: (
		{ min, max }: { min: number; max: number } = { min: 1, max: 10 }
	) =>
		new RoleSelectMenuBuilder({
			customId: "roleSelect",
			minValues: min,
			maxValues: max
		})
} as const;

export const channelSelect = {
	customId: "channelSelect",
	component: ({
		channelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement],
		max = 1,
		min = 1
	}: {
		channelTypes?: Array<ChannelType>;
		max?: number;
		min?: number;
	} = {}) =>
		new ChannelSelectMenuBuilder()
			.setChannelTypes(channelTypes)
			.setCustomId("channelSelect")
			.setMaxValues(max)
			.setMinValues(min)
} as const;
