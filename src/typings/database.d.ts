import type { GiveawayData, PrizeData, WinnerData } from "@prisma/client";

export type GiveawayDataWithIncludes = GiveawayData & {
	prizes: Array<PrizeData & { winners: Array<WinnerData> }>;
};
