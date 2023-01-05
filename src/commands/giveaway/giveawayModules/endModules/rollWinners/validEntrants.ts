import { type Collection, type Guild, type GuildMember } from "discord.js";
import { type GiveawayDataWithIncludes } from "../../../../../typings/database.js";

export function isValidEntrant({
	entryId,
	members,
	giveaway
}: {
	entryId: string;
	members: Collection<string, GuildMember>;
	giveaway: GiveawayDataWithIncludes;
}) {
	const minimumAccountAge = Number(giveaway.minimumAccountAge);
	const requiredRolesIds = giveaway.requiredRolesIds;

	const member = members.get(entryId);

	if (!member) {
		return false;
	}

	if (
		minimumAccountAge &&
		Date.now() - member.user.createdTimestamp < minimumAccountAge
	) {
		return false;
	}

	if (
		requiredRolesIds.length &&
		!member.roles.cache.hasAll(...requiredRolesIds)
	) {
		return false;
	}

	return true;
}

export async function sortValidEntrants(
	giveaway: GiveawayDataWithIncludes,
	guild: Guild
) {
	const entries = [...new Set(giveaway.entriesUserIds)];
	const members = await guild.members.fetch({ force: true });

	return entries.filter((entryId) =>
		isValidEntrant({ entryId, members, giveaway })
	);
}
