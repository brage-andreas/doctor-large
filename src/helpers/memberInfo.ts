import { stripIndents } from "common-tags";
import {
	inlineCode,
	type EmbedField,
	type GuildMember,
	type User
} from "discord.js";
import listify from "./listify.js";
import longstamp from "./timestamps.js";

export default function getMemberInfo(
	member: GuildMember,
	prefix?: string
): [EmbedField, EmbedField];
export default function getMemberInfo(
	member: User,
	prefix?: string
): [EmbedField];
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
					Name: Unknown user
					Created: Unknown user
				`
			}
		];
	}

	const user = "guild" in member ? member.user : member;

	const userField: EmbedField = {
		inline: false,
		name: prefix ? `${prefix} user info` : "User info",
		value: stripIndents`
			Name: ${user} - ${inlineCode(user.tag)} (${user.id})
			Created: ${longstamp(user.createdAt)}
		`
	};

	if (!("guild" in member)) {
		return [userField];
	}

	const numAtStart = (string: string) => Number(string.split(" ")[0]) || 0;

	const roleArray = [...member.roles.cache.values()];

	const highestLevelRole = roleArray.reduce((highestNum, role) => {
		const n = numAtStart(role.name);

		return highestNum < n ? n : highestNum;
	}, 0);

	const filteredRoleMentions = [...member.roles.cache.values()].reduce(
		(roleMentionsArray, role) => {
			if (role.id === role.guild.id) {
				return roleMentionsArray;
			}

			if (
				!numAtStart(role.name) ||
				highestLevelRole <= numAtStart(role.name)
			) {
				roleMentionsArray.push(role.toString());
			}

			return roleMentionsArray;
		},
		[] as Array<string>
	);

	return [
		userField,
		{
			inline: false,
			name: prefix ? `${prefix} member info` : "Member info",
			value: stripIndents`
				Nickname: ${member.nickname ? `${member.nickname}` : "None"}
				Joined: ${member.joinedAt ? longstamp(member.joinedAt) : "Unknown"}
				Roles: ${
					filteredRoleMentions.length
						? listify(filteredRoleMentions, { length: 7 })
						: "None"
				}
			`
		}
	];
}
