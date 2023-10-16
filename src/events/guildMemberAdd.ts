import { Events, type GuildMember } from "discord.js";
import AutoroleManager from "#database/autorole.js";
import { type EventExport } from "#typings";
import Logger from "#logger";

const execute = async (member: GuildMember) => {
	if (member.user.bot) {
		return;
	}

	const logger = new Logger({ guild: member.guild, label: "AUTOROLE" });

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
		logger.log(`Gave ${autorole.validRoles.length} role(s) to ${member.user.tag} (${member.id})`);
	} else {
		logger.setOptions({ color: "red" }).log(`Failed to give roles to ${member.user.tag} (${member.id})`);
	}
};

export const getEvent: EventExport = () => ({
	event: Events.GuildMemberAdd,
	execute,
});
