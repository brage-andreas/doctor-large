import { type GuildMember } from "discord.js";
import AutoroleManager from "../database/autorole.js";

export async function run(oldMember: GuildMember, newMember: GuildMember) {
	// Autorole
	if (oldMember.pending && !newMember.pending) {
		if (newMember.user.bot) {
			return;
		}

		const autoroleManager = new AutoroleManager(newMember.guild.id);

		const autoroleOptions = await autoroleManager.get();

		if (
			!autoroleOptions?.activated ||
			autoroleOptions.roleIds.length === 0
		) {
			return;
		}

		newMember.roles.add(autoroleOptions.roleIds).catch(() => null);
	}
}
