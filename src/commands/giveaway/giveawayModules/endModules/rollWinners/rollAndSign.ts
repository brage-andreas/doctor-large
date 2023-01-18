import type GiveawayManager from "../../../../../database/giveaway.js";
import type Prize from "../../../../../modules/Prize.js";
import roll from "./roll.js";

export async function rollAndSign(options: {
	giveawayManager: GiveawayManager;
	giveawayId: number;

	entries: Array<string>;
	prizes: Array<Prize>;
	prizesQuantity: number;
	winnerQuantity: number;
	onlyUnclaimed?: boolean;
}) {
	const {
		giveawayManager,
		entries,
		prizes,
		prizesQuantity,
		winnerQuantity,
		onlyUnclaimed
	} = options;

	const dataMap = roll({
		entries,
		prizes,
		prizesQuantity,
		winnerQuantity,
		onlyUnclaimed
	});

	await giveawayManager.deleteWinners({ keep: WIP });

	if (!dataMap?.size) {
		return;
	}

	for (const [prizeId, data] of dataMap.entries()) {
		for (const { userId, quantityWon } of data) {
			await giveawayManager.upsertWinner({
				quantityWon,
				userId,
				prize: {
					connect: {
						id: prizeId
					}
				}
			});
		}
	}
}
