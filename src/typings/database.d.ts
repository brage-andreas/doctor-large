import type { GiveawayData, PrizeData, WinnerData } from "@prisma/client";

export type GiveawayDataWithIncludes = GiveawayData & {
	prizes: Array<PrizeData & { winners: Array<WinnerData> }>;
};

export type PrizeDataWithIncludes = PrizeData & {
	giveaway: GiveawayData;
	winners: Array<WinnerData>;
};

type WonPrize = Exclude<PrizeData, "winners"> & {
	quantityWon: number;
	accepted: boolean;
};
