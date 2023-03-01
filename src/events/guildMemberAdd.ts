import AutoroleManager from "#database/autorole.js";
import Logger from "#logger";
import { type GuildMember } from "discord.js";

export async function run(member: GuildMember) {
	if (member.user.bot) {
		return;
	}

	const logger = new Logger({ prefix: "AUTOROLE", guild: member.guild });

	const autoroleManager = new AutoroleManager(member.guild);
	await autoroleManager.initialize();

	const autorole = await autoroleManager.get();

	if (!autorole.activated || autorole.validRoles.length === 0) {
		return;
	}

	const success = await member.roles
		.add(autorole.validRoles)
		.then(() => true)
		.catch(() => false);

	if (success) {
		logger.log(
			`Gave ${autorole.validRoles.length} role(s) to ${member.user.tag} (${member.id})`
		);
	} else {
		logger
			.setColor("red")
			.log(`Failed to give roles to ${member.user.tag} (${member.id})`);
	}
}
