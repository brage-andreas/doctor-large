import { type Giveaway } from "@prisma/client";
import { type AutocompleteInteraction } from "discord.js";
import GiveawayManager from "../../../database/giveaway.js";

export default async function (interaction: AutocompleteInteraction<"cached">) {
	const guild = interaction.guild;
	const focusedRaw = parseInt(interaction.options.getFocused()) || undefined;

	const giveawayManager = new GiveawayManager(guild.id);

	const focused =
		(Number.isNaN(focusedRaw) ? null : focusedRaw) ??
		((await giveawayManager.getQuantityInGuild()) || 1);

	// ensures offset will never be under 0
	const offset = focused <= 3 ? 0 : focused - 3;
	const offsetGiveaways = await giveawayManager.getWithOffset(offset);

	const getName = (data: Giveaway) => {
		const id = data.guildRelativeId;
		const emoji = id === focused ? "✨" : id > focused ? "🔸" : "🔹";
		const activeEmoji = !data.active
			? "🔴 "
			: data.entriesLocked
			? "🔒 "
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
		name: "😴 Whoa so empty — there are no giveaways",
		value: 0
	};

	const response = fullResponse ?? [emptyResponse];

	interaction.respond(response);
}
