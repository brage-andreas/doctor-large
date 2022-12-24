import { type Prize, type Winner } from "@prisma/client";
import theirPrizes from "../../../../helpers/theirPrizes.js";
import { type GiveawayWithIncludes } from "../../../../typings/database.js";

export function getAllWinners(giveaway: GiveawayWithIncludes) {
	const winners = [
		...giveaway.prizes.reduce((pool, prize) => {
			prize.winners.forEach((winner) => pool.add(winner.userId));

			return pool;
		}, new Set<string>())
	];

	if (!winners.length) {
		return null;
	}

	return winners;
}

export function getWinnersPerPrize(giveaway: GiveawayWithIncludes) {
	const pool: Set<Winner> = new Set();

	giveaway.prizes.forEach(({ winners }) => {
		winners.forEach((winner) => {
			pool.add(winner);
		});
	});

	return [...pool];
}

export function getWinnersAndTheirPrizes(giveaway: GiveawayWithIncludes) {
	type WonPrize = Exclude<Prize, "winners"> & {
		quantityWon: number;
	};
	const pool: Map<string, Array<WonPrize>> = new Map();

	const allWinnerIds = giveaway.prizes.reduce((pool, { winners }) => {
		winners.forEach(({ userId }) => pool.add(userId));

		return pool;
	}, new Set<string>());

	allWinnerIds.forEach((winnerId) => {
		const prizes = theirPrizes(giveaway, winnerId);

		const toPool = prizes.reduce((pool: Array<WonPrize>, prize) => {
			pool.push({
				additionalInfo: prize.additionalInfo,
				giveawayId: prize.giveawayId,
				quantity: prize.quantity,
				name: prize.name,
				id: prize.id,
				quantityWon: prize.winners[0].quantityWon
			});

			return pool;
		}, []);

		pool.set(winnerId, toPool);
	});

	return pool;
}
