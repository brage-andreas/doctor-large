import { type GuildMember } from "discord.js";
import { REGEXP } from "../constants.js";

const autoroleIds = process.env.AUTOROLE_IDS?.trim()
	.split(/\s+/g)
	.filter((id) => REGEXP.ID.test(id));

export async function run(member: GuildMember) {
	if (member.pending || member.user.bot || !autoroleIds) {
		return;
	}

	member.roles.add(autoroleIds).catch(() => {});
}
