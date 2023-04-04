import components from "#components";
import { Colors, Emojis, Regex } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import s from "#helpers/s.js";
import yesNo from "#helpers/yesNo.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import {
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	inlineCode,
	type APIButtonComponentWithCustomId,
	type ButtonInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import toDashboard from "../dashboard.js";
import toCreatePrize from "./prizeModules/createPrize.js";
import toPrizeDashboard from "./prizeModules/prizeDashboard.js";

export default async function toManagePrizes(
	interaction: ButtonInteraction<"cached"> | ModalSubmitInteraction<"cached">,
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

	const prizesButtons: Array<APIButtonComponentWithCustomId> =
		giveaway.prizes.map(({ id }, index) => ({
			custom_id: `dashboard-prize-${id}`,
			label: `Prize ${index + 1}`,
			style: ButtonStyle.Primary,
			type: ComponentType.Button
		}));

	const prizeButtonsRow = components.createRows(...prizesButtons);

	const disableCreate = giveaway.prizes.length >= 10;

	const rows = [
		...prizeButtonsRow,
		...components.createRows(
			components.buttons.back,
			components.set.disabled(components.buttons.create, disableCreate),
			components.buttons.clear
		)
	];

	const getPrizesKey = (start: number, end: number) =>
		giveaway.prizes.length
			? giveaway.prizes
					.slice(start, end)
					.map(
						(prize, index) =>
							`${inlineCode(`Prize ${start + index + 1}`)} - ${
								prize.quantity
							}x ${prize.name}`
					)
					.join("\n")
			: "None";

	const embed = new EmbedBuilder().setTitle("Prizes");

	if (prizesButtons.length === 2) {
		embed.setColor(Colors.Green).setFields(
			{
				inline: true,
				value: getPrizesKey(0, 5),
				name: "Row 1"
			},
			{
				inline: true,
				value: getPrizesKey(5, 10),
				name: "Row 2"
			}
		);
	} else if (prizesButtons.length === 1) {
		embed.setColor(Colors.Green).setDescription(getPrizesKey(0, 5));
	} else {
		embed.setColor(Colors.Red).setDescription("There are no prizes yet.");
	}

	new Logger({ prefix: "GIVEAWAY", interaction }).log(
		`Opened prizes manager for giveaway #${giveaway.id}`
	);

	const msg = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed]
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
		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				await buttonInteraction.deferUpdate();

				toDashboard(buttonInteraction, id);

				return;
			}

			case components.buttons.create.customId: {
				toCreatePrize(buttonInteraction, id, giveawayManager);

				return;
			}

			case components.buttons.clear.customId: {
				await buttonInteraction.deferUpdate();

				if (giveaway.winnersUserIds().size) {
					const n = giveaway.winnersUserIds().size;

					const proceed = await yesNo({
						yesStyle: ButtonStyle.Danger,
						noStyle: ButtonStyle.Secondary,
						filter: (i) => i.user.id === interaction.user.id,
						medium: buttonInteraction,
						data: {
							content: stripIndents`
								${Emojis.Warn} Are you sure you want to clear the prizes?
								This will wipe the prizes of ${n} ${s("winner", n)}, and the winners themselves!
							`,
							embeds: []
						}
					});

					if (!proceed) {
						toManagePrizes(buttonInteraction, id, giveawayManager);

						return;
					}
				}

				await giveaway.reset({ prizesAndWinners: true });

				toManagePrizes(buttonInteraction, id, giveawayManager);

				return;
			}
		}

		await buttonInteraction.deferUpdate();

		const match = buttonInteraction.customId.match(
			Regex.DashboardPrizeCustomId
		);

		const prizeIdString = match?.groups?.id;
		const prizeId = prizeIdString ? parseInt(prizeIdString) : undefined;

		if (!prizeId && prizeId !== 0) {
			return;
		}

		toPrizeDashboard(buttonInteraction, prizeId, giveawayManager, id);
	});
}
