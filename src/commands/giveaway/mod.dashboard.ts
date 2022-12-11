import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ComponentType,
	type ButtonBuilder,
	type Message
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

const dashboard = async (message: Message<true>, giveawayId: number) => {
	const giveawayManager = new GiveawayManager(message.guildId);
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await message.edit({
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
		giveawayComponents.dashboard.row2.endButton()
	);

	const msg = await message.edit({
		content: await formatGiveaway(giveaway, false),
		components: [row1, row2],
		embeds: []
	});

	const collector = msg.createMessageComponentCollector({
		filter: (interaction) => interaction.user.id === message.author.id,
		componentType: ComponentType.Button
	});

	collector.on("ignore", (interaction) => {
		interaction.reply({
			content: "🚫 This button is not for you.",
			ephemeral: true
		});
	});

	collector.on("collect", (interaction) => {
		switch (interaction.customId) {
			case "publishGiveaway": {
				toPublishGiveaway(interaction, giveawayId, giveawayManager);
				break;
			}

			case "republishGiveaway": {
				toRepublishGiveaway(interaction, giveawayId, giveawayManager);
				break;
			}

			case "lockEntries": {
				const flippedLockEntries = !giveaway.lockEntries;

				giveawayManager.edit({
					where: {
						giveawayId
					},
					data: {
						lockEntries: flippedLockEntries
					}
				});

				dashboard(message, giveawayId);

				break;
			}

			case "setRequiredRoles": {
				toSetRequiredRoles(interaction, giveawayId, giveawayManager);
				break;
			}

			case "setPingRoles": {
				toSetPingRoles(interaction, giveawayId, giveawayManager);
				break;
			}

			case "editGiveaway": {
				toEditGiveaway(interaction, giveawayId, giveawayManager);
				break;
			}

			case "managePrizes": {
				toManagePrizes(interaction, giveawayId, giveawayManager);
				break;
			}

			case "endGiveaway": {
				toEndGiveaway(interaction, giveawayId, giveawayManager);
				break;
			}
		}
	});
};

export default async function toDashboard(
	message: Message<true>,
	giveawayId: number
) {
	await dashboard(message, giveawayId);
}
