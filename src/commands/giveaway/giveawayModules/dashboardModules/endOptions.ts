import { oneLine, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	EmbedBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import ms from "ms";
import components from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import { longStamp } from "../../../../helpers/timestamps.js";
import toEndGiveaway from "./endGiveaway.js";

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

	const adjustments = ["15 minutes", "1 hour", "1 day", "1 week", "30 days"];

	const plusButtons = adjustments.map((time) =>
		adjustDate({ label: `+${time}`, customId: `+${ms(time)}` })
	);

	const minusButtons = adjustments.map((time) =>
		adjustDate({ label: `-${time}`, customId: `-${ms(time)}` })
	);

	const { endDate } = giveaway;

	//  hour in milliseconds = 3_600_000
	const isRounded = endDate && endDate.getTime() % 3_600_000 === 0;
	const roundedDate = endDate && new Date(endDate);

	if (roundedDate) {
		if (roundedDate.getMinutes() < 30) {
			roundedDate.setMinutes(0, 0, 0);
		} else {
			roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
		}
	}

	const endOptionsEmbed = new EmbedBuilder()
		.setTitle("End options")
		.addFields({
			name: "End automation level",
			value: stripIndents`
				Define what should happen when the giveaway ends.
				The host will be notified in DMs when the giveaway ends.
				Note: You will always have the option to do this manually at any time.

				• None: No automation.
				• End: End the giveaway; no one can enter.
				• Roll: Roll the winners. 
				• Publish: Publish the winners. This will also notify them.
			`
		});

	if (endDate) {
		endOptionsEmbed.setDescription(
			oneLine`
				The end date is set to:
				${longStamp(endDate, { extraLong: true })}.
			`
		);
	} else {
		endOptionsEmbed.setDescription("The end date is not set.");
	}

	const msg = await interaction.editReply({
		components: [
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				setDate.component(),
				clearDate.component().setDisabled(!endDate),
				roundDateToNearestHour
					.component()
					.setDisabled(!endDate && Boolean(isRounded)),
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
		const adjustDateRegExp = /^(?<prefix>\+|-)(?<time>\d+)$/;

		switch (buttonInteraction.customId) {
			case setDate.customId: {
				//

				return toEndOptions(interaction, id, giveawayManager);
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

				return toEndOptions(interaction, id, giveawayManager);
			}

			case roundDateToNearestHour.customId: {
				await giveaway.edit(
					{
						endDate: roundedDate
					},
					{
						nowOutdated: {
							publishedMessage: true
						}
					}
				);

				return toEndOptions(interaction, id, giveawayManager);
			}

			case endGiveaway.customId: {
				return toEndGiveaway(buttonInteraction, id, giveawayManager);
			}
		}

		const groups =
			buttonInteraction.customId.match(adjustDateRegExp)?.groups;

		const operator = groups?.prefix;
		const milliseconds = groups?.time;

		const newTimestamp = eval(
			`${endDate || Date.now()}${operator}${milliseconds}`
		);

		const newEndDate = new Date(newTimestamp);

		await giveaway.edit(
			{
				endDate: newEndDate
			},
			{
				nowOutdated: {
					publishedMessage: true
				}
			}
		);

		return toEndOptions(interaction, id, giveawayManager);
	});
}
