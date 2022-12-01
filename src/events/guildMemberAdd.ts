import { type GuildMember } from "discord.js";
import AutoroleManager from "../database/autorole.js";

export async function run(member: GuildMember) {
	// Autorole
	if (!member.pending && !member.user.bot) {
		const autoroleManager = new AutoroleManager(member.guild.id);

		const autoroleOptions = await autoroleManager.get();

		if (
			!autoroleOptions?.activated ||
			autoroleOptions.roleIds.length === 0
		) {
			return;
		}

		member.roles.add(autoroleOptions.roleIds).catch(() => null);
	}
}
