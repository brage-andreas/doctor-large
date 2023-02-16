import { type EndAutomation } from "@prisma/client";
import { oneLine, source, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import ms from "ms";
import components from "../../../../components/index.js";
import { EMOJIS, GIVEAWAY } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import { longstamp } from "../../../../helpers/timestamps.js";
import toDashboard from "../dashboard.js";
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

	const { endDate, endAutomation: endAutomationLevel } = giveaway;

	const minTime = () => Date.now() + GIVEAWAY.MIN_END_DATE_BUFFER;

	const {
		adjustDate,
		back,
		clearDate,
		endGiveaway,
		endLevelEnd,
		endLevelNone,
		endLevelPublish,
		endLevelRoll,
		roundDateToNearestHour,
		setDate
	} = components.buttons;

	const adjustments = ["15 minutes", "1 hour", "1 day", "1 week", "30 days"];

	const plusButtons = adjustments.map((time) =>
		adjustDate({ label: `+${time}`, customId: `+${ms(time)}` })
	);

	const minusButtons = adjustments.map((time) => {
		const milliseconds = ms(time);
		let disabled = false;

		if (!endDate) {
			disabled = true;
		} else if (endDate.getTime() - milliseconds < minTime()) {
			disabled = true;
		}

		return adjustDate({
			label: `-${time}`,
			customId: `-${milliseconds}`,
			disabled
		});
	});

	const endLevelButtons = () => {
		const none = endLevelNone.component();
		const end = endLevelEnd.component();
		const roll = endLevelRoll.component();
		const publish = endLevelPublish.component();

		const setSuccess = (...buttons: Array<ButtonBuilder>) =>
			buttons.forEach((b) => b.setStyle(ButtonStyle.Success));

		switch (endAutomationLevel) {
			case "Publish": {
				publish.setDisabled();
				setSuccess(none, end, roll, publish);

				break;
			}

			case "Roll": {
				roll.setDisabled();
				setSuccess(none, end, roll);

				break;
			}

			case "End": {
				end.setDisabled();
				setSuccess(none, end);

				break;
			}

			case "None": {
				none.setStyle(ButtonStyle.Success).setDisabled();

				break;
			}
		}

		return [none, end, roll, publish];
	};

	//  hour in milliseconds = 3_600_000
	const isRounded = endDate && endDate.getTime() % 3_600_000 === 0;
	const roundedDate = !isRounded ? new Date(endDate!) : null;

	if (roundedDate) {
		if (
			roundedDate.getMinutes() < 30 &&
			minTime() <= roundedDate.getTime()
		) {
			roundedDate.setMinutes(0, 0, 0);
		} else {
			roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
		}
	}

	const bufferStr = ms(GIVEAWAY.MIN_END_DATE_BUFFER, { long: true });
	const hostDMStr = ms(GIVEAWAY.END_HOST_DM_BEFORE_END, { long: true });

	const endOptionsEmbed = new EmbedBuilder()
		.setTitle("End options")
		.addFields({
			name: "End automation level",
			value: source`
				Define what should happen when the giveaway ends.
				You can always end the giveaway manually.
				The host will be notified: ${hostDMStr} before, and on end.

				End automation levels:
				  • None: No automation. The host will still be notified.
				  • End: End the giveaway; no one can enter or leave.
				  • Roll: Roll the winners. 
				  • Publish: Publish the winners. This will also notify them.

				Currently set to: ${endAutomationLevel}
			`
		})
		.setFooter({
			text: `The date must be at least ${bufferStr} in the future.`
		});

	if (endDate) {
		endOptionsEmbed.setDescription(
			oneLine`
				The end date is set to:
				${longstamp(endDate, { extraLong: true })}.
			`
		);
	} else {
		endOptionsEmbed.setDescription("The end date is not set.");
	}

	const missingParts: Array<string> = [];

	if (!giveaway.prizesQuantity()) {
		missingParts.push("Add one or more prizes");
	}

	if (!giveaway.channelId) {
		missingParts.push("Publish the giveaway");
	}

	const cannotEnd =
		!giveaway.prizesQuantity() || giveaway.channelId
			? source`
				${EMOJIS.ERROR} The giveaway cannot be ended:
				  → ${missingParts.join("\n→ ")}
			`
			: undefined;

	const msg = await interaction.editReply({
		content: cannotEnd,
		components: [
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				setDate.component(),
				clearDate.component().setDisabled(!endDate),
				roundDateToNearestHour
					.component()
					.setDisabled(Boolean(isRounded)),
				endGiveaway.component()
			),
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				...plusButtons.map((button) => button.component())
			),
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				...minusButtons.map((button) => button.component())
			),
			new ActionRowBuilder<ButtonBuilder>().setComponents(
				back.component(),
				...endLevelButtons()
			)
		],
		embeds: [endOptionsEmbed]
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

		if (buttonInteraction.customId !== setDate.customId) {
			await buttonInteraction.deferUpdate();
		}

		const endLevel = async (newLevel: EndAutomation) => {
			await giveaway.edit({
				endAutomation: newLevel,
				nowOutdated: {
					publishedMessage: true
				}
			});

			return toEndOptions(buttonInteraction, id, giveawayManager);
		};

		switch (buttonInteraction.customId) {
			case back.customId: {
				return toDashboard(buttonInteraction, id);
			}

			case setDate.customId: {
				//

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case clearDate.customId: {
				await giveaway.edit({
					endDate: null,
					nowOutdated: {
						publishedMessage: true
					}
				});

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case roundDateToNearestHour.customId: {
				await giveaway.edit({
					endDate: roundedDate,
					nowOutdated: {
						publishedMessage: true
					}
				});

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case endGiveaway.customId: {
				return toEndGiveaway(buttonInteraction, id, giveawayManager);
			}

			case endLevelNone.customId: {
				await endLevel("None");

				break;
			}

			case endLevelEnd.customId: {
				await endLevel("End");

				break;
			}

			case endLevelRoll.customId: {
				await endLevel("Roll");

				break;
			}

			case endLevelPublish.customId: {
				await endLevel("Publish");

				break;
			}
		}

		const groups =
			buttonInteraction.customId.match(adjustDateRegExp)?.groups;

		const operator = groups?.prefix;
		const milliseconds = groups?.time;

		if (operator || milliseconds) {
			const newTimestamp = eval(
				`${endDate?.getTime() || Date.now()}${operator}${milliseconds}`
			);

			const newEndDate = new Date(newTimestamp);

			await giveaway.edit({
				endDate: newEndDate,
				nowOutdated: {
					publishedMessage: true
				}
			});
		}

		return toEndOptions(buttonInteraction, id, giveawayManager);
	});
}
