import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	ComponentType,
	type ChatInputCommandInteraction,
	type TextChannel
} from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import GiveawayManager from "../../database/giveaway.js";
import { longStamp } from "../../helpers/timestamps.js";

const backButton = new ButtonBuilder()
	.setCustomId("back")
	.setLabel("Back")
	.setStyle(ButtonStyle.Secondary);

export default async function (
	interaction: ChatInputCommandInteraction<"cached">,
	customId?: number
) {
	// I don't know why but customId && interaction...
	// infers type number | undefined
	const id = customId
		? customId
		: interaction.options.getInteger("giveaway", true);

	const giveawayManager = new GiveawayManager(interaction.guildId);
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction[interaction.replied ? "followUp" : "reply"]({
			content: stripIndents`
				How did we get here?
			
				⚠️ This giveaway does not exist. Try creating one or double-check the ID.
			`
		});

		return;
	}

	const publishButton = giveaway.messageId
		? giveawayComponents.dashboard.row1.republishButton()
		: giveawayComponents.dashboard.row1.publishButton();

	const lockEntriesButton = giveaway.lockEntries
		? giveawayComponents.dashboard.row1.unlockEntriesButton()
		: giveawayComponents.dashboard.row1.lockEntriesButton();

	const setRolesButton = giveawayComponents.dashboard.row1.setRolesButton();

	const clearRolesButton = giveawayComponents.dashboard.row1
		.clearRolesButton()
		.setDisabled(!giveaway.requiredRoles.length);

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishButton,
		lockEntriesButton,
		setRolesButton,
		clearRolesButton
	);

	const editGiveawayButton = giveawayComponents.dashboard.row2.editButton();
	const endGiveawayButton = giveawayComponents.dashboard.row2.endButton();
	const managePrizesButton =
		giveawayComponents.dashboard.row2.managePrizesButton();

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		editGiveawayButton,
		managePrizesButton,
		endGiveawayButton
	);

	const editGiveawayModal = giveawayComponents.edit.editOptionsModal(
		giveaway.giveawayId,
		giveaway.giveawayTitle,
		giveaway.giveawayDescription,
		giveaway.numberOfWinners
	);

	editGiveawayModal;

	// (re)publish, lock entries, required roles
	// edit, prizes, end giveaway

	const msg = await interaction[interaction.replied ? "followUp" : "reply"]({
		content: "WIP",
		components: [row1, row2],
		fetchReply: true
	});

	const collector = msg.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		componentType: ComponentType.Button
	});

	collector.on("ignore", (i) => {
		i.reply({ content: "🚫 This button is not for you." });
	});

	collector.on("collect", async (i) => {
		if (i.customId === "publishGiveaway") {
			const channelSelectMenu = new ChannelSelectMenuBuilder()
				.setCustomId("channelSelect")
				.setMinValues(1)
				.setMaxValues(1)
				.setChannelTypes(
					ChannelType.GuildText,
					ChannelType.GuildAnnouncement
				);

			const chooseChannelStr = stripIndents`
				Select the channel you would like to publish the giveaway in.

				→ Title: ${giveaway.giveawayTitle}
				→ Created: ${longStamp(giveaway.createdTimestamp)}
			`;

			const row1 =
				new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
					channelSelectMenu
				);

			const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
				backButton
			);

			const followUp = await i.followUp({
				content: chooseChannelStr,
				components: [row1, row2],
				fetchReply: true
			});

			const component = await followUp.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id
			});

			if (component.customId === "back") {
				//
			}

			if (component.customId === "channelSelect") {
				if (!component.isChannelSelectMenu()) {
					i.update({
						content: "⚠️ Something went wrong. Try again.",
						components: []
					});

					return;
				}

				const channelId = component.values[0];
				const channel = interaction.guild.channels.cache.get(
					channelId
				) as TextChannel | undefined;

				if (!channel) {
					i.update({
						content: "⚠️ This channel does not exist.",
						components: []
					});

					return;
				}

				const msg = await channel.messages.send({
					content: "WIP"
				});

				giveawayManager.edit({
					where: {
						giveawayId: giveaway.giveawayId
					},
					data: {
						lastEditedTimestamp: Date.now().toString(),
						lastEditedUserTag: i.user.tag,
						lastEditedUserId: i.user.id,
						messageId: msg.id,
						channelId
					}
				});
			}
		}
	});
}
