import { type EmbedField, type GuildMember, type User } from "discord.js";
import { stripIndents } from "common-tags";
import longstamp from "./timestamps.js";
import listify from "./listify.js";
import getTag from "./getTag.js";

export default function getMemberInfo(member: GuildMember, prefix?: string): [EmbedField, EmbedField];
export default function getMemberInfo(member: User, prefix?: string): [EmbedField];
export default function getMemberInfo(
	member: GuildMember | User | null,
	prefix?: string
): [EmbedField, EmbedField] | [EmbedField];
export default function getMemberInfo(
	member: GuildMember | User | null,
	prefix?: string
): [EmbedField, EmbedField] | [EmbedField] {
	if (!member) {
		return [
			{
				inline: false,
				name: prefix ? `${prefix} user info` : "User info",
				value: stripIndents`
					* Name: Unknown user
					* Created: Unknown user
				`,
			},
		];
	}

	const user = "guild" in member ? member.user : member;

	const userField: EmbedField = {
		inline: false,
		name: prefix ? `${prefix} user info` : "User info",
		value: stripIndents`
			* Name: ${getTag(user, { id: true })}
			* Created: ${longstamp(user.createdAt)}
		`,
	};

	if (!("guild" in member)) {
		return [userField];
	}

	const roleMentionsWithoutEveryone = [...member.roles.cache.values()].reduce<Array<string>>(
		(roleMentionsArray, role) => {
			if (role.id === role.guild.id) {
				return roleMentionsArray;
			}

			roleMentionsArray.push(role.toString());

			return roleMentionsArray;
		},
		[]
	);

	return [
		userField,
		{
			inline: false,
			name: prefix ? `${prefix} member info` : "Member info",
			value: stripIndents`
				* Nickname: ${member.nickname ? `${member.nickname}` : "None"}
				* Joined: ${member.joinedAt ? longstamp(member.joinedAt) : "Unknown"}
				* Roles: ${roleMentionsWithoutEveryone.length > 0 ? listify(roleMentionsWithoutEveryone, { length: 7 }) : "None"}
			`,
		},
	];
}
