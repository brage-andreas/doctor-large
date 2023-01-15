import type Giveaway from "../../../../../modules/Giveaway.js";
import type Prize from "../../../../../modules/Prize.js";

export default function roll(entries: Array<string>, giveaway: Giveaway) {
	const alwaysFullBucket = new Set(entries);
	const oneTimeBucket = new Set(entries);

	const prizesQuantity = giveaway.prizesQuantity();
	const winnerQuantity = giveaway.winnerQuantity;

	const prizesWithOneWinner = giveaway.prizes.reduce((prizeArray, prize) => {
		const arrayOfCurrentPrizes: Array<Prize> = Array.from(
			{ length: prize.quantity },
			() => {
				const clone = prize.clone();

				clone.data.quantity = 1;
				clone.quantity = 1;

				return clone;
			}
		);

		prizeArray.push(...arrayOfCurrentPrizes);

		return prizeArray;
	}, [] as Array<Prize>);

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
