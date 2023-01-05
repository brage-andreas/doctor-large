import { type PrizeData, type WinnerData } from "@prisma/client";
import {
	type GiveawayDataWithIncludes,
	type WonPrize
} from "../../../../typings/database.js";

export function getAllWinners(giveaway: GiveawayDataWithIncludes) {
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

export function prizeToWonPrize(
	prize: PrizeData & { winners: Array<WinnerData> },
	winnerUserId: string
): WonPrize | null {
	const winner = prize.winners.find(
		(winner) => winner.userId === winnerUserId
	);

	if (!winner) {
		return null;
	}

	const { additionalInfo, giveawayId, quantity, name, id } = prize;
	const { quantityWon, accepted } = winner;

	return {
		additionalInfo,
		quantityWon,
		giveawayId,
		accepted,
		quantity,
		name,
		id
	};
}

/**
 * Mapped by winners' user ID's.
 */
export function giveawayToWonPrizesMap(
	giveaway: GiveawayDataWithIncludes
): Map<string, Array<WonPrize>> {
	return giveaway.prizes.reduce((wonPrizeMap, prize) => {
		prize.winners.forEach((winner) => {
			const wonPrize = prizeToWonPrize(prize, winner.userId);

			if (!wonPrize) {
				return;
			}

			const alreadyMappedWonPrizes = wonPrizeMap.get(winner.userId) ?? [];

			wonPrizeMap.set(winner.userId, [
				...alreadyMappedWonPrizes,
				wonPrize
			]);
		});

		return wonPrizeMap;
	}, new Map<string, Array<WonPrize>>());
}
