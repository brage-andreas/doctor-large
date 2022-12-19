import { type Guild } from "discord.js";
import type GiveawayManager from "../../../database/giveaway.js";

export const rollWinners = async (options: {
	customNumberOfWinners?: number;
	giveawayManager: GiveawayManager;
	giveawayId: number;
	guild: Guild;
}) => {
	const { customNumberOfWinners, giveawayManager, giveawayId, guild } =
		options;

	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return [];
	}

	// removes duplicates
	const entries: Array<string> = [...new Set(giveaway.userEntriesIds)];

	const requiredRoles = giveaway.requiredRoles;
	const minimumAccountAge = Number(giveaway.minimumAccountAge);
	const numberToRoll = customNumberOfWinners ?? giveaway.numberOfWinners;

	const members = await guild.members.fetch({ force: true });

	const validEntrants = entries.filter((userId) => {
		const member = members.get(userId);

		if (!member) {
			return false;
		}

		if (
			minimumAccountAge &&
			minimumAccountAge <= Date.now() - member.user.createdTimestamp
		) {
			return false;
		}

		if (
			requiredRoles.length &&
			!member.roles.cache.hasAll(...requiredRoles)
		) {
			return false;
		}

		return true;
	});

	const entriesBucket: Set<string> = new Set(validEntrants);
	let retries = 0;

	for (let i = 0; i < numberToRoll; i++) {
		const prize = giveaway.prizes.at(i);
		const rolledUserId = [...entriesBucket.values()].at(
			Math.floor(Math.random() * entriesBucket.size)
		);

		if (!rolledUserId) {
			// this is so it doesn't loop forever
			// in case there are more prizes than entries
			retries++;
			i--;

			if (4 < retries) {
				break;
			}

			continue;
		}

		retries = 0;

		const { winnerId } = await giveawayManager.createWinner({
			giveawayId,
			accepted: false,
			userId: rolledUserId,
			prizes: {
				connect: {
					prizeId: prize?.prizeId
				}
			}
		});

		await giveawayManager.editPrize({
			where: {
				prizeId: prize?.prizeId
			},
			data: {
				winnerId
			}
		});

		entriesBucket.delete(rolledUserId);
	}

	return await giveawayManager
		.getWinners(giveawayId)
		.then((winners) => winners.map((winner) => winner.userId));
};
