import { type GuildMember } from "discord.js";
import { REGEXP } from "../constants.js";

const autoroleIds = process.env.AUTOROLE_IDS?.trim()
	.split(/\s+/g)
	.filter((id) => REGEXP.ID.test(id));

export async function run(oldMember: GuildMember, newMember: GuildMember) {
	// Autorole
	if (oldMember.pending && !newMember.pending) {
		if (!newMember.user.bot && autoroleIds !== undefined) {
			newMember.roles.add(autoroleIds).catch(() => {});
		}
	}
}
