import type PrizeModule from "#modules/prize.js";

export default function roll(options: {
	entries: Array<string>;
	overrideClaimed: boolean;
	prizes: Array<PrizeModule>;
	prizesQuantity: number;
	winnerQuantity: number;
}) {
	const { entries, overrideClaimed, prizes, prizesQuantity, winnerQuantity } = options;

	if (entries.length === 0 || !prizesQuantity || !winnerQuantity) {
		return null;
	}

	const alwaysFullBucket = new Set(entries);
	const oneTimeBucket = new Set(entries);

	const prizeIdsToRoll = prizes.flatMap((prize) => {
		let length = prize.quantity;

		if (!overrideClaimed) {
			const winnerArray = [...prize.winners.values()];
			const newLength = winnerArray.reduce((n, { claimed }) => (claimed ? n - 1 : n), prize.quantity);

			length = newLength;
		}

		return Array.from({ length }, () => prize.id);
	});

	const random = (setOrArray: Array<string> | Set<string>) => {
		const array = "size" in setOrArray ? [...setOrArray] : setOrArray;

		return array[Math.floor(Math.random() * array.length)];
	};

	const getRandomUserId = () => {
		if (oneTimeBucket.size === 0) {
			return random(alwaysFullBucket);
		}

		const userId = random(oneTimeBucket);
		oneTimeBucket.delete(userId);

		return userId;
	};

	let delegatedPrizes = 0;
	const winners: Array<{ prizeId: number; userId: string }> = [];

	for (let index = 0; index < prizeIdsToRoll.length; index++) {
		const currentPrizeId = prizeIdsToRoll.at(index);

		if (!currentPrizeId) {
			continue;
		}

		// if there are enough winners but the prizes aren't filled
		// if say there are 1 winner but 10 prizes
		// used so you reuse the same winners for the prizes remaining
		const winnersFilledButNotPrizes = delegatedPrizes === winnerQuantity;

		let randomWinnerUserId: string;
		winnersFilledButNotPrizes;

		if (winnersFilledButNotPrizes) {
			randomWinnerUserId = random(winners.map(({ userId: winnerUserId }) => winnerUserId));

			delegatedPrizes--;
		} else {
			randomWinnerUserId = getRandomUserId();
		}

		winners.push({
			prizeId: currentPrizeId,
			userId: randomWinnerUserId,
		});

		delegatedPrizes++;
	}

	return winners;
}
