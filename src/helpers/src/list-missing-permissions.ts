import { type ForumChannel, type GuildTextBasedChannel, type PermissionFlagsBits } from "discord.js";

/**
 * Returns an array of missing permissions formatted as:
 * ```
 * ["`View Channel`", "`Send Messages`"]
 * ```
 *
 * If there are no missing permissions the array will be empty.
 */
export const listMissingPermissions = (
	channel: ForumChannel | GuildTextBasedChannel,
	...toCheck: Array<keyof typeof PermissionFlagsBits | null | undefined>
) => {
	const permissions = channel.guild.members.me && channel.permissionsFor(channel.guild.members.me);

	if (!permissions) {
		return [];
	}

	return toCheck.reduce<Array<string>>((missingPermissions, permission) => {
		if (!permission || !permissions.has(permission)) {
			return missingPermissions;
		}

		missingPermissions.push(`\`${permission.split(/(?=[A-Z])/).join(" ")}\``);

		return missingPermissions;
	}, []);
};
