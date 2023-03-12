import { type Client } from "discord.js";
import checkEndingGiveawaysFn from "./giveawayEnding.js";

export default function (options: {
	client: Client<true>;
	jobs: {
		all?: boolean;
		giveawayEnd?: boolean;
	};
}) {
	if (options.jobs.all || options.jobs.giveawayEnd) {
		checkEndingGiveawaysFn(options.client);
	}
}
