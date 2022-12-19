import { type Guild } from "discord.js";
import type GiveawayManager from "../../../database/giveaway.js";

export const rollWinners = async (options: {
	giveawayManager: GiveawayManager;
	giveawayId: number;
	guild: Guild;
}) => {
	const { giveawayManager, giveawayId, guild } = options;

	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return [];
	}

	const unclaimedPrizes = giveaway.prizes.filter(
		(prize) => !prize.winner?.accepted
	);

	const requiredRoles = giveaway.requiredRoles;
	const minimumAccountAge = Number(giveaway.minimumAccountAge);

	// removes duplicates
	const entries = [...new Set(giveaway.userEntriesIds)];

	const members = await guild.members.fetch({ force: true });

	const validEntrants = entries.filter((userId) => {
		const member = members.get(userId);

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
			requiredRoles.length &&
			!member.roles.cache.hasAll(...requiredRoles)
		) {
			return false;
		}

		return true;
	});

	if (validEntrants.length) {
		const entriesBucket = new Set(validEntrants);
		const fullEntriesBucket = new Set(validEntrants);

		const rollUserId = () => {
			const random = (set: Set<string>) =>
				[...set.values()].at(Math.floor(Math.random() * set.size));

			if (!entriesBucket.size) {
				return random(fullEntriesBucket);
			}

			return random(entriesBucket);
		};

		for (const prize of unclaimedPrizes) {
			const rolledUserId = rollUserId()!;

			const oldPrizes = giveaway.prizes
				.filter(
					(prize) =>
						prize.winner?.userId === rolledUserId &&
						prize.winner.accepted
				)
				.map((prize) => ({ prizeId: prize.prizeId }));

			const { winnerId } = await giveawayManager.upsertWinner({
				giveawayId,
				accepted: false,
				userId: rolledUserId,
				prizes: {
					connect: [
						...oldPrizes,
						{
							prizeId: prize?.prizeId
						}
					]
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
	}

	return await giveawayManager
		.getWinners(giveawayId)
		.then((winners) => winners.map((winner) => winner.userId));
};
