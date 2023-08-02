import { type GuildMember, type User } from "discord.js";

const _getTag = (userOrMember: GuildMember | User) => {
	const { discriminator, username, tag } =
		"guild" in userOrMember ? userOrMember.user : userOrMember;

	return discriminator === "0" ? `@${username}` : tag;
};

export function getTag(
	userOrMember: GuildMember | User,
	options?: { id: boolean }
) {
	if (options?.id) {
		return `${_getTag(userOrMember)} (${userOrMember.id})`;
	}

	return _getTag(userOrMember);
}
