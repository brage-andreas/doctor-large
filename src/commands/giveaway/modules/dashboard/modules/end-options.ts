import {
	type APIButtonComponent,
	type ButtonInteraction,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	bold,
} from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import { Colors, Emojis, Giveaway } from "#constants";
import { oneLine, stripIndents } from "common-tags";
import { EndAutomation } from "@prisma/client";
import toEndGiveaway from "./end-giveaway.js";
import components from "#discord-components";
import toDashboard from "../dashboard.js";
import { longstamp } from "#helpers";
import ms from "ms";

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
			embeds: [],
		});

		return;
	}

	const { channelId, endAutomation, endDate } = giveaway;

	const minTime = () => Date.now() + Giveaway.MinimumEndDateBuffer;

	const adjustments = ["15 minutes", "1 hour", "1 day", "1 week", "30 days"];

	const plusButtons = adjustments.map((time) =>
		components.buttons.adjustDate({
			customId: `+${ms(time)}`,
			label: `+${time}`,
		})
	);

	const minusButtons = adjustments.map((time) => {
		const milliseconds = ms(time);
		let disabled = false;

		if (!endDate) {
			disabled = true;
		} else if (endDate.getTime() - milliseconds < minTime()) {
			disabled = true;
		}

		return components.buttons.adjustDate({
			customId: `-${milliseconds}`,
			disabled,
			label: `-${time}`,
		});
	});

	const setSuccess = (...buttons: Array<APIButtonComponent>) => {
		for (const b of buttons) {
			b.style = ButtonStyle.Success;
		}
	};

	const endLevelButtons = () => {
		const none = components.buttons.endLevelNone.component();
		const end = components.buttons.endLevelEnd.component();
		const roll = components.buttons.endLevelRoll.component();
		const announce = components.buttons.endLevelAnnounce.component();

		switch (endAutomation) {
			case EndAutomation.Announce: {
				announce.disabled = true;
				setSuccess(end, roll, announce);

				break;
			}

			case EndAutomation.Roll: {
				roll.disabled = true;
				setSuccess(end, roll);

				break;
			}

			case EndAutomation.End: {
				end.disabled = true;
				setSuccess(end);

				break;
			}

			case EndAutomation.None: {
				none.style = ButtonStyle.Success;
				none.disabled = true;

				break;
			}
		}

		return [none, end, roll, announce];
	};

	//  hour in milliseconds = 3_600_000
	const isRounded = endDate && endDate.getTime() % 3_600_000 === 0;
	const roundedDate = endDate && !isRounded ? new Date(endDate) : null;

	if (roundedDate) {
		if (roundedDate.getMinutes() < 30 && minTime() <= roundedDate.getTime()) {
			roundedDate.setMinutes(0, 0, 0);
		} else {
			roundedDate.setHours(roundedDate.getHours() + 1, 0, 0, 0);
		}
	}

	const bufferString = ms(Giveaway.MinimumEndDateBuffer, { long: true });
	const hostDMString = ms(Giveaway.HostDMTimeBeforeEnd, { long: true });

	const endOptionsEmbed = new EmbedBuilder()
		.setTitle("End options")
		.setColor(endDate ? Colors.Green : Colors.Red)
		.addFields({
			name: "End automation level",
			value: stripIndents`
				Define what should happen when the giveaway ends.
				You can always end the giveaway manually.
				The host will be notified ${hostDMString} before, and on end.

				Levels:
				1. ${bold("None")}: No automation. (The host will be notified as normal.)
				2. ${bold("End")}: End the giveaway; no one can enter or leave.
				3. ${bold("Roll")}: Roll the winners. This will also End.
				4. ${bold("Announce")}: Announce and notify the winners. This will also Roll.

				Currently set to: ${bold(endAutomation)}
			`,
		})
		.setFooter({
			text: `The date must be at least ${bufferString} in the future.`,
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
		missingParts.push("* Add one or more prizes");
	}

	if (!channelId) {
		missingParts.push("* Announce the giveaway");
	}

	const cannotEnd =
		!giveaway.prizesQuantity() || !channelId
			? stripIndents`
				${Emojis.Error} The giveaway cannot be ended:
				${missingParts.join("\n")}
			`
			: undefined;

	const rows = components.createRows(
		components.set.disabled(components.buttons.setDate, true),
		components.set.disabled(components.buttons.clearDate, !endDate),
		components.set.disabled(components.buttons.roundDateToNearestHour, isRounded),
		components.buttons.endGiveaway,
		...plusButtons,
		...minusButtons,
		components.buttons.back,
		...endLevelButtons()
	);

	const message = await interaction.editReply({
		components: rows,
		content: cannotEnd,
		embeds: [endOptionsEmbed],
	});

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
		max: 1,
		time: 120_000,
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction
			.reply({
				content: `${Emojis.NoEntry} This button is not for you.`,
				ephemeral: true,
			})
			.catch(() => null);
	});

	collector.on("collect", async (buttonInteraction) => {
		const adjustDateRegExp = /^(?<prefix>\+|-)(?<time>\d+)$/;

		if (buttonInteraction.customId !== components.buttons.setDate.customId) {
			await buttonInteraction.deferUpdate();
		}

		const endLevel = async (newLevel: EndAutomation) => {
			await giveaway.edit({
				endAutomation: newLevel,
				nowOutdated: {
					announcementMessage: true,
				},
			});

			return toEndOptions(buttonInteraction, id, giveawayManager);
		};

		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				return toDashboard(buttonInteraction, id);
			}

			case components.buttons.setDate.customId: {
				//

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case components.buttons.clearDate.customId: {
				await giveaway.edit({
					endDate: null,
					nowOutdated: {
						announcementMessage: true,
					},
				});

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case components.buttons.roundDateToNearestHour.customId: {
				await giveaway.edit({
					endDate: roundedDate,
					nowOutdated: {
						announcementMessage: true,
					},
				});

				return toEndOptions(buttonInteraction, id, giveawayManager);
			}

			case components.buttons.endGiveaway.customId: {
				return toEndGiveaway(buttonInteraction, id, giveawayManager);
			}

			case components.buttons.endLevelNone.customId: {
				await endLevel(EndAutomation.None);

				break;
			}

			case components.buttons.endLevelEnd.customId: {
				await endLevel(EndAutomation.End);

				break;
			}

			case components.buttons.endLevelRoll.customId: {
				await endLevel(EndAutomation.Roll);

				break;
			}

			case components.buttons.endLevelAnnounce.customId: {
				await endLevel(EndAutomation.Announce);

				break;
			}
		}

		const groups = buttonInteraction.customId.match(adjustDateRegExp)?.groups;

		const operator = groups?.prefix;
		const milliseconds = groups?.time;

		if (operator && milliseconds) {
			const newTimestamp = eval(`${endDate?.getTime() ?? Date.now()}${operator}${milliseconds}`) as number;

			const newEndDate = new Date(newTimestamp);

			await giveaway.edit({
				endDate: newEndDate,
				nowOutdated: {
					announcementMessage: true,
				},
			});
		}

		return toEndOptions(buttonInteraction, id, giveawayManager);
	});
}
