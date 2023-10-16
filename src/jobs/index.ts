import checkEndingGiveawaysFunction from "./end-giveaway.js";
import { type Client } from "discord.js";

export default function (options: {
	client: Client<true>;
	jobs: {
		all?: boolean;
		giveawayEnd?: boolean;
	};
}) {
	if (options.jobs.all ?? options.jobs.giveawayEnd) {
		void checkEndingGiveawaysFunction(options.client);
	}
}
