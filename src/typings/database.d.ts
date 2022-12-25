import type { Giveaway, Prize, Winner } from "@prisma/client";

export type GiveawayWithIncludes = Giveaway & {
	prizes: Array<Prize & { winners: Array<Winner> }>;
};

export type PrizeWithIncludes = Prize & {
	giveaway: Giveaway;
	winners: Array<Winner>;
};

type WonPrize = Exclude<Prize, "winners"> & {
	quantityWon: number;
	accepted: boolean;
};
