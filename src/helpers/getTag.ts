import { type GuildMember, type User } from "discord.js";

const _getTag = (
	userOrMember:
		| GuildMember
		| User
		| { discriminator: number | string; username: string; id: string }
) => {
	const { discriminator, username } =
		"guild" in userOrMember ? userOrMember.user : userOrMember;

	return discriminator === "0"
		? `@${username}`
		: `${username}#${discriminator}`;
};

const normalizeData = (
	data:
		| GuildMember
		| User
		| { discriminator: number | string; username: string; id: string }
		| { tag: string; id: string }
) => {
	if (!("username" in data) && !("guild" in data)) {
		const split = data.tag.split("#");

		if (split.length === 1) {
			split.push("0");
		}

		const discriminator = split.pop() ?? "0";

		return {
			discriminator,
			id: data.id,
			username: split.join("#")
		};
	}

	return data;
};

export default function getTag(
	userOrMember:
		| GuildMember
		| User
		| { discriminator: number | string; username: string; id: string }
		| { tag: string; id: string },
	options?: { id: boolean }
) {
	if (options?.id) {
		return `${_getTag(normalizeData(userOrMember))} (${userOrMember.id})`;
	}

	return _getTag(normalizeData(userOrMember));
}
