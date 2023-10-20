import { type GuildMember, type User } from "discord.js";

/**
 * This is needed until all Discord accounts move from Discord's old username discriminator system.
 * @example
 * getUsername(someUser) // "greg#2039"
 * getUsername(someUser, { id: true }) // "greg#2039 (123456789012345678)"
 *
 * getUsername(someOtherUser) // "@ClarkKillah"
 * getUsername(someOtherUser, { id: true }) // "@ClarkKillah (123456789012345678)"
 *
 * getUsername(someMember) // "shannon83plays"
 * getUsername({ tag: "johnbeast#0" }) // "@johnbeast"
 */
export const getUsername = (
	userOrMember: { id: string; tag: string } | GuildMember | User,
	options?: { id: boolean }
) => {
	const isUser = "username" in userOrMember;
	const isMember = "guild" in userOrMember;

	let username: string;
	let discriminator: string;

	if (!isUser && !isMember) {
		const split = userOrMember.tag.split("#");

		username = split[0];
		discriminator = split[1] || "0";
	} else {
		username = isMember ? userOrMember.user.username : userOrMember.username;
		discriminator = isMember ? userOrMember.user.discriminator : userOrMember.discriminator;
	}

	const tag = discriminator === "0" ? `@${username}` : `${username}#${discriminator}`;

	if (options?.id) {
		return `${tag} (${userOrMember.id})`;
	}

	return tag;
};
