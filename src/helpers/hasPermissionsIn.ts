import {
	type GuildTextBasedChannel,
	type PermissionFlagsBits
} from "discord.js";

export default function hasPermissionsIn(
	channel: GuildTextBasedChannel,
	...toCheck: Array<keyof typeof PermissionFlagsBits | null | undefined>
) {
	const permissions =
		channel.guild.members.me &&
		channel.permissionsFor(channel.guild.members.me);

	if (!permissions) {
		return [];
	}

	const missing: Array<string> = [];

	for (const permission of toCheck) {
		if (!permission) {
			continue;
		}

		if (!permissions.has(permission)) {
			missing.push(`\`${permission.split(/(?=[A-Z])/).join(" ")}\``);
		}
	}

	return missing;
}
