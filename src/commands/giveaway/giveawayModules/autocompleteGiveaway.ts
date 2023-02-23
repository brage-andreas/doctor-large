import { EMOJIS } from "#constants";
import GiveawayManager from "#database/giveaway.js";
import { type Giveaway } from "@prisma/client";
import { type AutocompleteInteraction } from "discord.js";

export default async function (interaction: AutocompleteInteraction<"cached">) {
	const guild = interaction.guild;

	const giveawayManager = new GiveawayManager(guild);
	const highestIdThatExists = await giveawayManager.getCountInGuild();

	const focused =
		parseInt(interaction.options.getFocused()) ||
		(await giveawayManager.getCountInGuild());

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

	const getName = (data: Giveaway) => {
		const id = data.guildRelativeId;

		let placement: string = EMOJIS.LOWER;

		if (focused === id) {
			placement = EMOJIS.SPARKS;
		} else if (focused < id) {
			placement = EMOJIS.HIGHER;
		}

		let status = "";

		if (data.ended) {
			status = `${EMOJIS.ENDED} `;
		} else if (data.entriesLocked) {
			status = `${EMOJIS.LOCK} `;
		}

		return `${placement} #${data.guildRelativeId} ${status}${data.title}`;
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

	const response = fullResponse.length ? fullResponse : [emptyResponse];

	interaction.respond(response);
}
