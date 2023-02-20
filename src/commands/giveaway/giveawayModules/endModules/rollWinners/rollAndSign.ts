import type Giveaway from "../../../../../modules/Giveaway.js";
import type PrizeModule from "../../../../../modules/Prize.js";
import roll from "./roll.js";

export async function rollAndSign(options: {
	entries: Array<string>;
	giveaway: Giveaway;
	ignoreRequirements: boolean;
	overrideClaimed: boolean;
	prizes: Array<PrizeModule>;
	prizesQuantity: number;
	winnerQuantity: number;
}) {
	const {
		giveaway,
		ignoreRequirements,
		overrideClaimed,
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

	if (overrideClaimed) {
		await giveaway.manager.deleteWinners(giveaway.data);
	} else {
		await giveaway.manager.deleteWinners(giveaway.data, {
			onlyDeleteUnclaimed: true
		});
	}

	const data = roll({
		entries,
		overrideClaimed,
		prizes,
		prizesQuantity,
		winnerQuantity
	});

	if (!data?.length) {
		return;
	}

	await giveaway.manager.createWinners(...data);

	return new Set(data.map((e) => e.userId));
}
