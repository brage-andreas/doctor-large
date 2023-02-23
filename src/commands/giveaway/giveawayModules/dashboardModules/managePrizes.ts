import components from "#components";
import { COLORS, EMOJIS, REGEXP } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import s from "#helpers/s.js";
import yesNo from "#helpers/yesNo.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
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
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const prizesButtons = giveaway.prizes.map(({ id }, index) =>
		new ButtonBuilder()
			.setCustomId(`dashboard-prize-${id}`)
			.setStyle(ButtonStyle.Primary)
			.setLabel(`Prize ${index + 1}`)
	);

	const sortedPrizeButtons = [
		prizesButtons.slice(0, 5),
		prizesButtons.slice(5, 10)
	].filter((e) => e.length);

	const { back, create, clear } = components.buttons;

	const createButton = create
		.component()
		.setDisabled(10 <= giveaway.prizes.length);

	const rows = [
		...sortedPrizeButtons,
		[back.component(), createButton, clear.component()]
	].map((buttonArray) =>
		new ActionRowBuilder<ButtonBuilder>().setComponents(buttonArray)
	);

	const getPrizesKey = (start: number, end: number) =>
		giveaway.prizes.length
			? giveaway.prizes
					.slice(start, end)
					.map(
						(prize, index) =>
							`\` Prize ${start + index + 1} \` - ${
								prize.quantity
							}x ${prize.name}`
					)
					.join("\n")
			: "None";

	const embed = new EmbedBuilder().setTitle("Prizes");

	if (sortedPrizeButtons.length === 2) {
		embed.setColor(COLORS.GREEN).setFields(
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
	} else if (sortedPrizeButtons.length === 1) {
		embed.setColor(COLORS.GREEN).setDescription(getPrizesKey(0, 5));
	} else {
		embed.setColor(COLORS.RED).setDescription("There are no prizes yet.");
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
			content: `${EMOJIS.NO_ENTRY} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case back.customId: {
				await buttonInteraction.deferUpdate();

				return toDashboard(buttonInteraction, id);
			}

			case create.customId: {
				return toCreatePrize(buttonInteraction, id, giveawayManager);
			}

			case clear.customId: {
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
								${EMOJIS.WARN} Are you sure you want to clear the prizes?
								This will wipe the prizes of ${n} ${s("winner", n)}, and the winners themselves!
							`,
							embeds: []
						}
					});

					if (!proceed) {
						return toManagePrizes(
							buttonInteraction,
							id,
							giveawayManager
						);
					}
				}

				await giveaway.reset({ prizesAndWinners: true });

				return toManagePrizes(buttonInteraction, id, giveawayManager);
			}
		}

		await buttonInteraction.deferUpdate();

		const match = buttonInteraction.customId.match(
			REGEXP.DASHBOARD_PRIZE_CUSTOM_ID
		);

		const prizeIdString = match?.groups?.id;
		const prizeId = prizeIdString ? parseInt(prizeIdString) : undefined;

		if (!prizeId && prizeId !== 0) {
			return;
		}

		toPrizeDashboard(buttonInteraction, prizeId, giveawayManager, id);
	});
}
