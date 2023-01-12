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
import { giveawayComponents } from "../../../../components/index.js";
import { COLORS, EMOJIS, REGEXP } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
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

	const createButton = new ButtonBuilder()
		.setCustomId("createPrize")
		.setStyle(ButtonStyle.Success)
		.setLabel("Create prize")
		.setDisabled(10 <= giveaway.prizes.length);

	const clearButton = new ButtonBuilder()
		.setCustomId("clearPrizes")
		.setStyle(ButtonStyle.Danger)
		.setLabel("Clear prizes")
		.setDisabled(!sortedPrizeButtons.length);

	const backButton = giveawayComponents.dashboard.backButton();

	const components = [
		...sortedPrizeButtons,
		[backButton, createButton, clearButton]
	].map((buttonArray) =>
		new ActionRowBuilder<ButtonBuilder>().setComponents(buttonArray)
	);

	const getEmbedValue = (start: number, end: number) =>
		giveaway.prizes.length
			? giveaway.prizes
					.slice(start, end)
					.map(
						(prize, index) =>
							`\`Prize ${start + index + 1}\` ${
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
				value: getEmbedValue(0, 5),
				name: "Row 1"
			},
			{
				inline: true,
				value: getEmbedValue(5, 10),
				name: "Row 2"
			}
		);
	} else if (sortedPrizeButtons.length === 1) {
		embed.setColor(COLORS.GREEN).setFields({
			value: getEmbedValue(0, 5),
			name: "Buttons"
		});
	} else {
		embed.setColor(COLORS.RED).setDescription("There are no prizes yet.");
	}

	const msg = await interaction.editReply({
		components,
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
			case "back": {
				await buttonInteraction.deferUpdate();

				return toDashboard(buttonInteraction, id);
			}

			case "createPrize": {
				return toCreatePrize(buttonInteraction, id, giveawayManager);
			}

			case "clearPrizes": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.deletePrizes(giveaway.data);

				return toManagePrizes(buttonInteraction, id, giveawayManager);
			}
		}

		const match = interaction.customId.match(REGEXP.ACCEPT_PRIZE_CUSTOM_ID);
		const prizeIdString = match?.groups?.id;
		const prizeId = prizeIdString ? parseInt(prizeIdString) : undefined;

		if (!prizeId && prizeId !== 0) {
			return;
		}

		toPrizeDashboard(buttonInteraction, prizeId, giveawayManager, id);
	});
}
