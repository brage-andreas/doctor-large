import { type RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import GiveawayManager from "../../database/giveaway.js";
import { type GiveawayWithIncludes } from "../../typings/database.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../../typings/index.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "my-giveaways",
	dm_permission: false,
	description: "View all the giveaways you have participated in."
};

const stringFromEnteredGiveaways = (giveaways: Array<GiveawayWithIncludes>) => {
	const activeGiveaways = giveaways.filter((g) => g.active);
	const notActiveGiveaways = giveaways.filter((g) => !g.active);

	// TODO
};

const run = async (interaction: CommandModuleInteractions) => {
	const id = interaction.user.id;

	const giveawayManager = new GiveawayManager(interaction.guildId);
	const allGiveaways = await giveawayManager.getAll();

	const [entered, hosted] = allGiveaways.reduce(
		(giveawayArray, giveaway) => {
			const isEntered = giveaway.entriesUserIds.includes(id);
			const isHost = giveaway.hostUserId === id;

			if (isEntered) {
				giveawayArray[0].push(giveaway);
			} else if (isHost) {
				giveawayArray[1].push(giveaway);
			}

			return giveawayArray;
		},
		[[], []] as [Array<GiveawayWithIncludes>, Array<GiveawayWithIncludes>]
	);
};

export const getCommand: () => Command = () => ({
	data,
	run
});
