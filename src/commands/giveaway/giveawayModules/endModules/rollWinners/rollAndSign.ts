import type Giveaway from "../../../../../modules/Giveaway.js";
import type Prize from "../../../../../modules/Prize.js";
import roll from "./roll.js";

export async function rollAndSign(options: {
	entries: Array<string>;
	giveaway: Giveaway;
	ignoreAccepted: boolean;
	ignoreRequirements: boolean;
	prizes: Array<Prize>;
	prizesQuantity: number;
	winnerQuantity: number;
}) {
	const {
		giveaway,
		ignoreAccepted,
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

	if (ignoreAccepted) {
		for (const prize of giveaway.prizes) {
			const keep: Array<string> = [];

			prize.winners.forEach((winner) => {
				if (winner.accepted) {
					keep.push(winner.userId);
				}
			});

			await giveaway.manager.deleteWinners({ keep, prizeId: prize.id });
		}
	}

	const dataMap = roll({
		entries,
		prizes,
		prizesQuantity,
		winnerQuantity,
		ignoreAccepted
	});

	if (!dataMap?.size) {
		return;
	}

	for (const [prizeId, data] of dataMap.entries()) {
		for (const { userId, quantityWon } of data) {
			await giveaway.manager.upsertWinner({
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
