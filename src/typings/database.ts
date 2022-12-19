import type { giveaway, giveawayPrize, giveawayWinner } from "@prisma/client";

export type CompleteGiveaway = giveaway & {
	prizes: Array<
		giveawayPrize & {
			winner: giveawayWinner | null;
		}
	>;
};

export type CompleteGiveawayPrize = giveawayPrize & {
	winner: giveawayWinner | null;
	giveaway: giveaway | null;
};

export type CompleteGiveawayWinners = giveawayWinner & {
	prizes: Array<
		giveawayPrize & {
			giveaway: giveaway | null;
		}
	>;
};
