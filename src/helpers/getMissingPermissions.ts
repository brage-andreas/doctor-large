import {
	inlineCode,
	type GuildTextBasedChannel,
	type PermissionFlagsBits
} from "discord.js";

/**
 * Returns an array of missing permissions formatted like: "SendMessages" -> "`Send Messages`".
 * If there are no missing permissions the array will be empty.
 */
export default function getMissingPermissions(
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
			missing.push(
				inlineCode(`${permission.split(/(?=[A-Z])/).join(" ")}`)
			);
		}
	}

	return missing;
}
