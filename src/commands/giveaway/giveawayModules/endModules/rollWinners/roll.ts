import type PrizeModule from "../../../../../modules/Prize.js";

export default function roll(options: {
	entries: Array<string>;
	ignoreClaimed: boolean;
	prizes: Array<PrizeModule>;
	prizesQuantity: number;
	winnerQuantity: number;
}) {
	const { entries, prizes, prizesQuantity, winnerQuantity, ignoreClaimed } =
		options;

	if (!entries.length || !prizesQuantity || !winnerQuantity) {
		return null;
	}

	const alwaysFullBucket = new Set(entries);
	const oneTimeBucket = new Set(entries);

	const prizesWithOneWinner = prizes.flatMap((prize) => {
		let length = prize.quantity;

		if (ignoreClaimed) {
			const winnerArray = [...prize.winners.values()];
			const newLength = winnerArray.reduce(
				(n, { claimed }) => (claimed ? n - 1 : n),
				prize.quantity
			);

			length = newLength;
		}

		return Array.from({ length }, () => {
			const clone = prize.clone();

			clone.data.quantity = 1;
			clone.quantity = 1;

			return clone;
		});
	});

	const random = (setOrArray: Array<string> | Set<string>) => {
		const array = "size" in setOrArray ? [...setOrArray] : setOrArray;

		return array.at(Math.floor(Math.random() * array.length))!;
	};

	const getRandomUserId = () => {
		if (!oneTimeBucket.size) {
			return random(alwaysFullBucket);
		}

		const userId = random(oneTimeBucket);
		oneTimeBucket.delete(userId);

		return userId;
	};

	let delegatedPrizes = 0;
	const winners: Array<string> = [];
	const winnerMap: Map<
		number,
		Array<{ userId: string; quantityWon: number }>
	> = new Map();

	for (let i = 0; i < prizesWithOneWinner.length; i++) {
		const currentPrize = prizesWithOneWinner.at(i);

		if (!currentPrize) {
			continue;
		}

		// if there are enough winners but the prizes aren't filled
		// if say there are 1 winner but 10 prizes
		// used so you reuse the same winners for the prizes remaining
		const winnersFilledButNotPrizes = delegatedPrizes === winnerQuantity;

		const randomWinnerUserId = winnersFilledButNotPrizes
			? random(winners)
			: getRandomUserId();

		if (!winnersFilledButNotPrizes) {
			winners.push(randomWinnerUserId);
		} else {
			delegatedPrizes--;
		}

		const currentEntry = winnerMap.get(currentPrize.id) ?? [];

		const ifAlreadyWonThisPrize = currentEntry.find(
			(e) => e.userId === randomWinnerUserId
		);

		const winnersOfThisPrize = currentEntry.filter(
			(e) => e.userId !== randomWinnerUserId
		);

		winnersOfThisPrize.push({
			userId: randomWinnerUserId,
			quantityWon: (ifAlreadyWonThisPrize?.quantityWon ?? 0) + 1
		});

		winnerMap.set(currentPrize.id, winnersOfThisPrize);

		delegatedPrizes++;
	}

	return winnerMap;
}
