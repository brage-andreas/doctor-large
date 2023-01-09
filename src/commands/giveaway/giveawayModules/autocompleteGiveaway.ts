import { type GiveawayData } from "@prisma/client";
import { type AutocompleteInteraction } from "discord.js";
import { EMOJIS } from "../../../constants.js";
import GiveawayManager from "../../../database/giveaway.js";

export default async function (interaction: AutocompleteInteraction<"cached">) {
	const guild = interaction.guild;

	const giveawayManager = new GiveawayManager(guild);
	const highestIdThatExists = await giveawayManager.getCountInGuild();

	let focused = parseInt(interaction.options.getFocused());

	if (!focused) {
		focused = 1;
	} else if (focused === 0) {
		focused = await giveawayManager.getNextGuildRelativeId();
	}

	const highestIdToTry = focused + 2;
	const lowestIdToTry = focused - 3;

	let skip = lowestIdToTry;

	if (highestIdThatExists < highestIdToTry) {
		skip -= highestIdToTry - highestIdThatExists;
	}

	if (skip < 0) {
		skip = 0;
	}

	const offsetGiveaways = await giveawayManager.getWithOffset(skip, 5);

	const getName = (data: GiveawayData) => {
		const id = data.guildRelativeId;
		const emoji =
			focused === id
				? EMOJIS.SPARKS
				: focused < id
				? EMOJIS.HIGHER
				: EMOJIS.LOWER;

		const activeEmoji = !data.active
			? `${EMOJIS.INACTIVE} `
			: data.entriesLocked
			? `${EMOJIS.LOCK} `
			: "";

		return `${emoji} #${data.guildRelativeId} ${activeEmoji}${data.title}`;
	};

	const fullResponse = offsetGiveaways
		.sort((a, b) => {
			// Makes the focused value always be atop
			if (a.guildRelativeId === focused) {
				return -1;
			}

			if (b.guildRelativeId === focused) {
				return 1;
			}

			// high -> low
			return b.guildRelativeId - a.guildRelativeId;
		})
		.map((data) => ({
			name: getName(data),
			value: data.id
		}));

	const emptyResponse = {
		name: `${EMOJIS.SLEEP} Whoa so empty — there are no giveaways`,
		value: -1
	};

	const response = fullResponse ?? [emptyResponse];

	interaction.respond(response);
}
