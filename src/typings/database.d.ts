import type { Giveaway, Prize, Winner } from "@prisma/client";
import type GiveawayModule from "../modules/Giveaway.js";

export type GiveawayWithIncludes = Giveaway & {
	prizes: Array<Prize & { winners: Array<Winner> }>;
};

export type PrizeWithIncludes = Prize & {
	winners: Array<Winner>;
	giveaway: GiveawayModule;
};
