import { type GiveawayData } from "@prisma/client";
import { type AutocompleteInteraction } from "discord.js";
import { EMOJIS } from "../../../constants.js";
import GiveawayManager from "../../../database/giveaway.js";

export default async function (interaction: AutocompleteInteraction<"cached">) {
	const guild = interaction.guild;

	const giveawayManager = new GiveawayManager(guild);
	const max = await giveawayManager.getQuantityInGuild();

	const focusedInt = parseInt(interaction.options.getFocused());
	const focused =
		focusedInt === 0
			? 0
			: focusedInt || (await giveawayManager.getQuantityInGuild()) || 1;

	const rawSkip = focused - 3;
	const skip =
		// if under 0, make it 0
		rawSkip < 0
			? 0
			: // if the highest id it will try to take is over the max in the guild
			//   make it 5 less than the max in the guild, so you will get the last 5
			max < 5 && max <= rawSkip + 5
			? max - 5
			: // else default to whatever value it was
			  rawSkip;

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
		value: 0
	};

	const response = fullResponse ?? [emptyResponse];

	interaction.respond(response);
}
