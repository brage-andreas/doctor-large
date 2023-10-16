import {
	type APIButtonComponentWithCustomId,
	type ButtonInteraction,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	type ModalSubmitInteraction,
	inlineCode,
} from "discord.js";
import toPrizeDashboard from "./prize/prize-dashboard.js";
import type GiveawayManager from "#database/giveaway.js";
import toCreatePrize from "./prize/create-prize.js";
import { Colors, Emojis, Regex } from "#constants";
import { stripIndents } from "common-tags";
import toDashboard from "../dashboard.js";
import components from "../../../../../discord-components/index.js";
import { s, yesNo } from "#helpers";
import Logger from "#logger";

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
			embeds: [],
		});

		return;
	}

	const prizesButtons: Array<APIButtonComponentWithCustomId> = giveaway.prizes.map(({ id }, index) => ({
		custom_id: `dashboard-prize-${id}`,
		label: `Prize ${index + 1}`,
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}));

	const disableCreate = giveaway.prizes.length >= 10;

	const rows = components.createRows.specific(prizesButtons.length, 3)(
		...prizesButtons,
		// ---
		components.buttons.back,
		components.set.disabled(components.buttons.create, disableCreate),
		components.buttons.clear
	);

	const getPrizesKey = (start: number, end: number) =>
		giveaway.prizes.length > 0
			? giveaway.prizes
					.slice(start, end)
					.map(
						(prize, index) =>
							`${inlineCode(`Prize ${start + index + 1}`)} - ${prize.quantity}x ${prize.name}`
					)
					.join("\n")
			: "None";

	const embed = new EmbedBuilder().setTitle("Prizes");

	if (prizesButtons.length === 2) {
		embed.setColor(Colors.Green).setFields(
			{
				inline: true,
				name: "Row 1",
				value: getPrizesKey(0, 5),
			},
			{
				inline: true,
				name: "Row 2",
				value: getPrizesKey(5, 10),
			}
		);
	} else if (prizesButtons.length === 1) {
		embed.setColor(Colors.Green).setDescription(getPrizesKey(0, 5));
	} else {
		embed.setColor(Colors.Red).setDescription("There are no prizes yet.");
	}

	new Logger({ interaction, label: "GIVEAWAY" }).log(`Opened prizes manager for giveaway #${giveaway.id}`);

	const message = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed],
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
		switch (buttonInteraction.customId) {
			case components.buttons.back.customId: {
				await buttonInteraction.deferUpdate();

				void toDashboard(buttonInteraction, id);

				return;
			}

			case components.buttons.create.customId: {
				void toCreatePrize(buttonInteraction, id, giveawayManager);

				return;
			}

			case components.buttons.clear.customId: {
				await buttonInteraction.deferUpdate();

				if (giveaway.winnersUserIds().size > 0) {
					const n = giveaway.winnersUserIds().size;

					const proceed = await yesNo({
						data: {
							content: stripIndents`
								${Emojis.Warn} Are you sure you want to clear the prizes?
								This will wipe the prizes of ${n} ${s("winner", n)}, and the winners themselves!
							`,
							embeds: [],
						},
						filter: (index) => index.user.id === interaction.user.id,
						medium: buttonInteraction,
						noStyle: ButtonStyle.Secondary,
						yesStyle: ButtonStyle.Danger,
					});

					if (!proceed) {
						void toManagePrizes(buttonInteraction, id, giveawayManager);

						return;
					}
				}

				await giveaway.reset({ prizesAndWinners: true });

				void toManagePrizes(buttonInteraction, id, giveawayManager);

				return;
			}
		}

		await buttonInteraction.deferUpdate();

		const match = buttonInteraction.customId.match(Regex.DashboardPrizeCustomId);

		const prizeIdString = match?.groups?.id;
		const prizeId = prizeIdString ? Number.parseInt(prizeIdString) : undefined;

		if (!prizeId && prizeId !== 0) {
			return;
		}

		void toPrizeDashboard(buttonInteraction, prizeId, giveawayManager, id);
	});
}
