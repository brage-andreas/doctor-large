import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import ms from "ms";
import components from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import { longStamp } from "../../../../helpers/timestamps.js";
import toDashboard from "../dashboard.js";

export default async function toSetEndDate(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const { setDate, clearDate, roundDateToNearestHour, adjustDate } =
		components.buttons;

	const adjustments = ["15 minutes", "1 hour", "1 day", "1 week", "1 month"];

	const plusButtons = adjustments.map((time) =>
		adjustDate({ label: `+${time}`, customId: `+${ms(time)}` })
	);

	const minusButtons = adjustments.map((time) =>
		adjustDate({ label: `-${time}`, customId: `-${ms(time)}` })
	);

	const { endDate } = giveaway;

	const endDateContent: Array<string> = [];

	if (endDate) {
		endDateContent.push(`The end date is set to: ${longStamp(endDate)}.`);
	} else {
		endDateContent.push("The end date is not set.");
	}

	await toDashboard(interaction, id);
}
