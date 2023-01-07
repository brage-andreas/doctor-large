import { type GuildMember } from "discord.js";
import AutoroleManager from "../database/autorole.js";
import Logger from "../logger/logger.js";

export async function run(member: GuildMember) {
	if (member.user.bot) {
		return;
	}

	const autoroleManager = new AutoroleManager(member.guild.id);
	await autoroleManager.initialize();

	const { activated, roleIds } = await autoroleManager.get();

	if (!activated || roleIds.length === 0) {
		return;
	}

	const success = await member.roles
		.add(roleIds)
		.then(() => true)
		.catch(() => false);

	if (success) {
		new Logger({ prefix: "AUTOROLE" }).log(
			`Gave ${roleIds.length} role(s) to ${member.user.tag} (${member.id})`
		);
	} else {
		new Logger({ prefix: "AUTOROLE", color: "red" }).log(
			`Failed to give roles to ${member.user.tag} (${member.id})`
		);
	}
}
