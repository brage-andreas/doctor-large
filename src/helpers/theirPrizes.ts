import { type GiveawayDataWithIncludes } from "../typings/database.js";

export default function theirPrizes(
	giveaway: GiveawayDataWithIncludes,
	userId: string
) {
	const id = userId;

	return giveaway.prizes
		.filter((prize) => prize.winners.some(({ userId }) => userId === id))
		.map((prize) => {
			const copy = structuredClone(prize);

			copy.winners = prize.winners.filter(({ userId }) => userId === id);

			return copy;
		});
}
