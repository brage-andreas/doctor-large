import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ComponentType,
	type ButtonInteraction
} from "discord.js";
import ms from "ms";
import components from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import { longStamp } from "../../../../helpers/timestamps.js";
import toDashboard from "../dashboard.js";

export default async function toEndOptions(
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

	const {
		setDate,
		clearDate,
		roundDateToNearestHour,
		endGiveaway,
		adjustDate
	} = components.buttons;

	const adjustments = ["15 minutes", "1 hour", "1 day", "1 week", "1 month"];

	const plusButtons = adjustments.map((time) =>
		adjustDate({ label: `+${time}`, customId: `+${ms(time)}` })
	);

	const minusButtons = adjustments.map((time) =>
		adjustDate({ label: `-${time}`, customId: `-${ms(time)}` })
	);

	const { endDate } = giveaway;
	const HOUR_IN_MS = 1000 * 60 * 60;

	const isRounded = endDate && endDate.getTime() % HOUR_IN_MS === 0;
	const roundedDate = endDate && new Date(endDate);

	if (roundedDate) {
		if (roundedDate.getMinutes() < 30) {
			roundedDate.setMinutes(0, 0, 0);
		} else {
			roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
		}
	}

	const endDateContent: Array<string> = [];

	if (endDate) {
		endDateContent.push(`The end date is set to: ${longStamp(endDate)}.`);
	} else {
		endDateContent.push("The end date is not set.");
	}

	const msg = await interaction.editReply({
		components: [
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				setDate.component(),
				clearDate.component().setDisabled(Boolean(endDate)),
				roundDateToNearestHour
					.component()
					.setDisabled(Boolean(endDate) && Boolean(isRounded)),
				endGiveaway.component()
			),
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				...plusButtons.map((button) => button.component())
			),
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				...minusButtons.map((button) => button.component())
			)
		]
	});

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		max: 1
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction.reply({
			content: `${EMOJIS.NO_ENTRY} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		const adjustDateRegExp = /^(?<prefix>+|-)(?<time>\d+)$/;

		switch (buttonInteraction.customId) {
			case setDate.customId: {
				//

				break;
			}

			case clearDate.customId: {
				await giveaway.edit(
					{
						endDate: null
					},
					{
						nowOutdated: {
							publishedMessage: true
						}
					}
				);

				break;
			}

			case roundDateToNearestHour.customId: {
				break;
			}

			case endGiveaway.customId: {
				break;
			}
		}

		const groups =
			buttonInteraction.customId.match(adjustDateRegExp)?.groups;

		const negative = groups?.prefix;
		const milliseconds = groups?.time;
	});

	await toDashboard(interaction, id);
}
