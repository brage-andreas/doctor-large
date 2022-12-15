import { type GuildMember } from "discord.js";
import AutoroleManager from "../database/autorole.js";
import Logger from "../logger/logger.js";

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

		const success = await member.roles
			.add(autoroleOptions.roleIds)
			.then(() => true)
			.catch(() => false);

		if (success) {
			new Logger({ prefix: "AUTOROLE" }).log(
				`Gave roles to ${member.user.tag} (${member.id})`
			);
		} else {
			new Logger({ prefix: "AUTOROLE", color: "red" }).log(
				`Failed to give roles to ${member.user.tag} (${member.id})`
			);
		}
	}
}
