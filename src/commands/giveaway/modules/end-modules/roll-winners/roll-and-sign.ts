import { type Snowflake, type WinnerId } from "#typings";
import type Giveaway from "#modules/giveaway.js";
import type PrizeModule from "#modules/prize.js";
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
	const { giveaway, ignoreRequirements, overrideClaimed, prizes, prizesQuantity, winnerQuantity } = options;

	let { entries } = options;

	if (!ignoreRequirements) {
		const members = await giveaway.guild.members.fetch();

		entries = entries.filter((userId) => {
			const member = members.get(userId);

			if (!member || !giveaway.isOldEnough(member) || !giveaway.memberHasRequiredRoles(member)) {
				return false;
			}

			return true;
		});
	}

	await giveaway.manager.deleteWinners(giveaway.data, {
		onlyDeleteUnclaimed: !overrideClaimed,
	});

	const data = roll({
		entries,
		overrideClaimed,
		prizes,
		prizesQuantity,
		winnerQuantity,
	});

	if (!data?.length) {
		return null;
	}

	const values = data.map((rollObject) => `(${rollObject.prizeId}, '${rollObject.userId}')`).join(",\n");

	return await giveaway.manager.prisma.$queryRawUnsafe<Array<{ id: WinnerId; userId: Snowflake }>>(
		`INSERT INTO guilds."Winner"("prizeId", "userId")
		 VALUES ${values}
		 RETURNING id, "userId";`
	);
}
