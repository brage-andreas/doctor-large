import { type Prize, type Winner } from "@prisma/client";
import { type GiveawayWithIncludes } from "../../../../../typings/database.js";

type PrizeWithWinners = Prize & {
	winners: Array<Winner>;
};

export default function roll(
	entries: Array<string>,
	giveaway: GiveawayWithIncludes
) {
	const alwaysFullBucket = new Set(entries);
	const oneTimeBucket = new Set(entries);

	const { prizes, winnerQuantity } = giveaway;
	const prizesQuantity = prizes.reduce(
		(acc, prize) => acc + prize.quantity,
		0
	);

	const prizesWithOneWinner = prizes.reduce((prizeArray, prize) => {
		const arrayOfCurrentPrizes: Array<PrizeWithWinners> = Array.from(
			{ length: prize.quantity },
			() => {
				const prizeCopy = structuredClone(prize);
				prizeCopy.quantity = 1;

				return prizeCopy;
			}
		);

		prizeArray.push(...arrayOfCurrentPrizes);

		return prizeArray;
	}, [] as Array<PrizeWithWinners>);

	if (!oneTimeBucket.size || !prizesQuantity || !winnerQuantity) {
		return null;
	}

	const randomFromSet = (set: Set<string>) =>
		[...set].at(Math.floor(Math.random() * set.size));

	const getWinner = () => {
		if (!oneTimeBucket.size) {
			const userId = randomFromSet(alwaysFullBucket)!;

			return userId;
		}

		const userId = randomFromSet(oneTimeBucket)!;
		oneTimeBucket.delete(userId);

		return userId;
	};

	let delegatedPrizes = 0;
	const winners: Array<string> = [];
	const winnerMap: Map<
		number,
		Array<{ userId: string; quantityWon: number }>
	> = new Map();

	for (let i = 0; i < prizesQuantity; i++) {
		const currentPrize = prizesWithOneWinner.at(i);

		if (currentPrize === undefined) {
			continue;
		}

		// if there are enough winners but the prizes aren't filled
		const winnersFilledButNotPrizes = delegatedPrizes === winnerQuantity;

		const randomWinner = winnersFilledButNotPrizes
			? winners[Math.floor(Math.random() * winners.length)]
			: getWinner();

		if (!winnersFilledButNotPrizes) {
			winners.push(randomWinner);
		} else {
			delegatedPrizes--;
		}

		const oldEntry = winnerMap.get(currentPrize.id) ?? [];
		const previous = oldEntry.find((e) => e.userId === randomWinner);
		const newArray = oldEntry.filter((e) => e.userId !== randomWinner);

		const newObject = {
			userId: randomWinner,
			quantityWon: (previous?.quantityWon ?? 0) + 1
		};

		newArray.push(newObject);

		winnerMap.set(currentPrize.id, newArray);

		delegatedPrizes++;
	}

	return winnerMap;
}
