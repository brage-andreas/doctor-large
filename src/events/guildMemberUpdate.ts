import { type GuildMember } from "discord.js";
import AutoroleManager from "../database/autorole.js";
import Logger from "../logger/logger.js";

export async function run(oldMember: GuildMember, newMember: GuildMember) {
	// Autorole
	if (oldMember.pending && !newMember.pending) {
		if (newMember.user.bot) {
			return;
		}

		const autoroleManager = new AutoroleManager(newMember.guild.id);
		await autoroleManager.initialize();

		const { activated, roleIds } = await autoroleManager.get();

		if (activated || roleIds.length === 0) {
			return;
		}

		const success = await newMember.roles
			.add(roleIds)
			.then(() => true)
			.catch(() => false);

		if (success) {
			new Logger({ prefix: "AUTOROLE" }).log(
				`Gave ${roleIds.length} roles to ${newMember.user.tag} (${newMember.id})`
			);
		} else {
			new Logger({ prefix: "AUTOROLE", color: "red" }).log(
				`Failed to give roles to ${newMember.user.tag} (${newMember.id})`
			);
		}
	}
}
