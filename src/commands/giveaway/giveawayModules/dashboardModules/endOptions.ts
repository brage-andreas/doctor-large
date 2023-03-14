import components from "#components";
import { Colors, Emojis, Giveaway } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { longstamp } from "#helpers/timestamps.js";
import { type EndAutomation } from "@prisma/client";
import { oneLine, source, stripIndents } from "common-tags";
import {
	bold,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import ms from "ms";
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
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const { endDate, endAutomation: endAutomationLevel } = giveaway;

	const minTime = () => Date.now() + Giveaway.MinimumEndDateBuffer;

	const {
		adjustDate,
		back,
		clearDate,
		endGiveaway,
		endLevelEnd,
		endLevelNone,
		endLevelAnnounce,
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
		const announce = endLevelAnnounce.component();

		const setSuccess = (...buttons: Array<ButtonBuilder>) =>
			buttons.forEach((b) => b.setStyle(ButtonStyle.Success));

		switch (endAutomationLevel) {
			case "Announce": {
				announce.setDisabled();
				setSuccess(end, roll, announce);

				break;
			}

			case "Roll": {
				roll.setDisabled();
				setSuccess(end, roll);

				break;
			}

			case "End": {
				end.setDisabled();
				setSuccess(end);

				break;
			}

			case "None": {
				none.setStyle(ButtonStyle.Success).setDisabled();

				break;
			}
		}

		return [none, end, roll, announce];
	};

	//  hour in milliseconds = 3_600_000
	const isRounded = endDate && endDate.getTime() % 3_600_000 === 0;
	const roundedDate = endDate && !isRounded ? new Date(endDate) : null;

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

	const bufferStr = ms(Giveaway.MinimumEndDateBuffer, { long: true });
	const hostDMStr = ms(Giveaway.HostDMTimeBeforeEnd, { long: true });

	const endOptionsEmbed = new EmbedBuilder()
		.setTitle("End options")
		.setColor(giveaway.endDate ? Colors.Green : Colors.Red)
		.addFields({
			name: "End automation level",
			value: stripIndents`
				Define what should happen when the giveaway ends.
				You can always end the giveaway manually.
				The host will be notified ${hostDMStr} before, and on end.

				Levels:
				1. ${bold("None")}: No automation. (The host will be notified as normal.)
				2. ${bold("End")}: End the giveaway; no one can enter or leave.
				3. ${bold("Roll")}: Roll the winners. This will also End.
				4. ${bold("Announce")}: Announce and notify the winners. This will also Roll.

				Currently set to: ${bold(endAutomationLevel)}
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
		missingParts.push("→ Add one or more prizes");
	}

	if (!giveaway.channelId) {
		missingParts.push("→ Announce the giveaway");
	}

	const cannotEnd =
		!giveaway.prizesQuantity() || !giveaway.channelId
			? source`
				${Emojis.Error} The giveaway cannot be ended:
				  ${missingParts.join("\n")}
			`
			: undefined;

	const rows = components.createRows(
		setDate.component().setDisabled(true),
		clearDate.component().setDisabled(!endDate),
		roundDateToNearestHour.component().setDisabled(Boolean(isRounded)),
		endGiveaway,
		...plusButtons,
		...minusButtons,
		back,
		...endLevelButtons()
	);

	const msg = await interaction.editReply({
		content: cannotEnd,
		components: rows,
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
			content: `${Emojis.NoEntry} This button is not for you.`,
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
					announcementMessage: true
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
						announcementMessage: true
					}
				});

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case roundDateToNearestHour.customId: {
				await giveaway.edit({
					endDate: roundedDate,
					nowOutdated: {
						announcementMessage: true
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

			case endLevelAnnounce.customId: {
				await endLevel("Announce");

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
					announcementMessage: true
				}
			});
		}

		return toEndOptions(buttonInteraction, id, giveawayManager);
	});
}
