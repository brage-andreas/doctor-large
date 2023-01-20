import type Giveaway from "../../../../../modules/Giveaway.js";
import type PrizeModule from "../../../../../modules/Prize.js";
import roll from "./roll.js";

export async function rollAndSign(options: {
	entries: Array<string>;
	giveaway: Giveaway;
	ignoreClaimed: boolean;
	ignoreRequirements: boolean;
	prizes: Array<PrizeModule>;
	prizesQuantity: number;
	winnerQuantity: number;
}) {
	const {
		giveaway,
		ignoreClaimed,
		ignoreRequirements,
		prizes,
		prizesQuantity,
		winnerQuantity
	} = options;

	let { entries } = options;

	if (!ignoreRequirements) {
		const members = await giveaway.guild.members.fetch({ force: true });

		entries = entries.filter((userId) => {
			const member = members.get(userId);

			if (
				!member ||
				!giveaway.isOldEnough(member) ||
				!giveaway.memberHasRequiredRoles(member)
			) {
				return false;
			}

			return true;
		});
	}

	if (ignoreClaimed) {
		for (const prize of giveaway.prizes) {
			const ids: Array<string> = [];

			prize.winners.forEach((winner) => {
				if (winner.claimed) {
					ids.push(winner.userId);
				}
			});

			await giveaway.manager.deleteWinners({
				inPrize: prize.id,
				winnersToKeep: ids
			});
		}
	}

	const dataMap = roll({
		entries,
		ignoreClaimed,
		prizes,
		prizesQuantity,
		winnerQuantity
	});

	if (!dataMap?.size) {
		return;
	}

	for (const [prizeId, data] of dataMap.entries()) {
		for (const { userId } of data) {
			await giveaway.manager.createWinner({
				prizeId,
				userId
			});
		}
	}
}
