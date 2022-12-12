import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	type ButtonBuilder,
	type ButtonInteraction,
	type CommandInteraction,
	type ModalSubmitInteraction
} from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import GiveawayManager from "../../database/giveaway.js";
import toEditGiveaway from "./mod.dashboard.editGiveaway.js";
import toEndGiveaway from "./mod.dashboard.endGiveaway.js";
import toManagePrizes from "./mod.dashboard.managePrizes.js";
import toPublishGiveaway from "./mod.dashboard.publishGiveaway.js";
import toRepublishGiveaway from "./mod.dashboard.republishGiveaway.js";
import toSetPingRoles from "./mod.dashboard.setPingRoles.js";
import toSetRequiredRoles from "./mod.dashboard.setRequiredRoles.js";
import formatGiveaway from "./mod.formatGiveaway.js";

const dashboard = async (
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayId: number
) => {
	const giveawayManager = new GiveawayManager(interaction.guildId);
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				⚠️ This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const publishButton = giveaway.messageId
		? giveawayComponents.dashboard.row1.republishButton()
		: giveawayComponents.dashboard.row1.publishButton();

	const lockEntriesButton = giveaway.lockEntries
		? giveawayComponents.dashboard.row1.unlockEntriesButton()
		: giveawayComponents.dashboard.row1.lockEntriesButton();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishButton,
		lockEntriesButton,
		giveawayComponents.dashboard.row1.setRequiredRolesButton(),
		giveawayComponents.dashboard.row1.setPingRolesButton()
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		giveawayComponents.dashboard.row2.editButton(),
		giveawayComponents.dashboard.row2.managePrizesButton(),
		giveawayComponents.dashboard.row2.endButton()
	);

	const msg = await interaction.editReply({
		content: await formatGiveaway(giveaway, false, interaction.guild),
		components: [row1, row2],
		embeds: []
	});

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === buttonInteraction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		max: 1
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction.reply({
			content: "🚫 This button is not for you.",
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		switch (buttonInteraction.customId) {
			case "publishGiveaway": {
				await buttonInteraction.deferUpdate();

				toPublishGiveaway(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case "republishGiveaway": {
				await buttonInteraction.deferUpdate();

				toRepublishGiveaway(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case "lockEntries": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: { giveawayId },
					data: { lockEntries: true }
				});

				dashboard(buttonInteraction, giveawayId);

				break;
			}

			case "unlockEntries": {
				await buttonInteraction.deferUpdate();

				await giveawayManager.edit({
					where: { giveawayId },
					data: { lockEntries: false }
				});

				dashboard(buttonInteraction, giveawayId);

				break;
			}

			case "setRequiredRoles": {
				await buttonInteraction.deferUpdate();

				toSetRequiredRoles(
					buttonInteraction,
					giveawayId,
					giveawayManager
				);

				break;
			}

			case "setPingRoles": {
				await buttonInteraction.deferUpdate();

				toSetPingRoles(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "editGiveaway": {
				// await buttonInteraction.deferUpdate();
				// Showing modal

				toEditGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "managePrizes": {
				await buttonInteraction.deferUpdate();

				toManagePrizes(buttonInteraction, giveawayId, giveawayManager);

				break;
			}

			case "endGiveaway": {
				await buttonInteraction.deferUpdate();

				toEndGiveaway(buttonInteraction, giveawayId, giveawayManager);

				break;
			}
		}
	});

	collector.on("end", (_, reason) => {
		if (reason !== "time") {
			return;
		}

		const components = [row1, row2].map((row) =>
			row.setComponents(
				row.components.map((component) => component.setDisabled(true))
			)
		);

		msg.edit({ components }).catch(() => null);
	});
};

export default async function toDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| CommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayId: number
) {
	await dashboard(interaction, giveawayId);
}
