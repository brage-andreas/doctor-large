import type Prize from "../../../../../modules/Prize.js";

export default function roll(options: {
	entries: Array<string>;
	prizes: Array<Prize>;
	prizesQuantity: number;
	winnerQuantity: number;
	onlyUnclaimed?: boolean;
}) {
	const { entries, prizes, prizesQuantity, winnerQuantity } = options;

	if (!entries.length || !prizesQuantity || !winnerQuantity) {
		return null;
	}

	const alwaysFullBucket = new Set(entries);
	const oneTimeBucket = new Set(entries);

	const prizesWithOneWinner = prizes.flatMap((prize) => {
		let length = prize.quantity;

		if (options.onlyUnclaimed) {
			length =
				prize.quantity -
				[...prize.winners.values()].reduce(
					(acc, winner) =>
						winner.accepted ? acc : acc + winner.quantityWon,
					0
				);
		}

		return Array.from({ length }, () => {
			const clone = prize.clone();

			clone.data.quantity = 1;
			clone.quantity = 1;

			return clone;
		});
	});

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
		// if say there are 1 winner but 10 prizes
		// used so you reuse the same winners for the prizes remaining
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

		newArray.push({
			userId: randomWinner,
			quantityWon: (previous?.quantityWon ?? 0) + 1
		});

		winnerMap.set(currentPrize.id, newArray);

		delegatedPrizes++;
	}

	return winnerMap;
}
