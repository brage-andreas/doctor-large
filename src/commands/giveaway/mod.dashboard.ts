import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	ComponentType,
	RoleSelectMenuBuilder,
	type ChatInputCommandInteraction,
	type ModalSubmitInteraction,
	type NewsChannel,
	type TextChannel
} from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import GiveawayManager from "../../database/giveaway.js";
import { listify } from "../../helpers/listify.js";
import formatGiveaway from "./mod.formatGiveaway.js";

const backButton = new ButtonBuilder()
	.setCustomId("back")
	.setLabel("Back")
	.setStyle(ButtonStyle.Secondary);

const dashboard = async (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	giveawayManager: GiveawayManager,
	id: number
) => {
	const giveaway = await giveawayManager.get(id);

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

	const setRequiredRolesButton =
		giveawayComponents.dashboard.row1.setRequiredRolesButton();

	const setPingRolesButton =
		giveawayComponents.dashboard.row1.setPingRolesButton();

	const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		publishButton,
		lockEntriesButton,
		setRequiredRolesButton,
		setPingRolesButton
	);

	const clearRequiredRolesButton = giveawayComponents.dashboard
		.clearRequiredRolesButton()
		.setDisabled(!giveaway.requiredRoles.length);

	const clearPingRolesButton = giveawayComponents.dashboard
		.clearPingRolesButton()
		.setDisabled(!giveaway.rolesToPing.length);

	clearPingRolesButton;
	clearRequiredRolesButton;

	const editGiveawayButton = giveawayComponents.dashboard.row2.editButton();

	const endGiveawayButton = giveawayComponents.dashboard.row2.endButton();

	const managePrizesButton =
		giveawayComponents.dashboard.row2.managePrizesButton();

	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		editGiveawayButton,
		managePrizesButton,
		endGiveawayButton
	);

	const msg = await interaction.editReply({
		content: await formatGiveaway(giveaway, false),
		components: [row1, row2],
		embeds: []
	});

	const collector = msg.createMessageComponentCollector({
		filter: (i) => i.user.id === interaction.user.id,
		componentType: ComponentType.Button
	});

	collector.on("ignore", (i) => {
		i.reply({
			content: "🚫 This button is not for you.",
			ephemeral: true
		});
	});

	collector.on("collect", async (i) => {
		const enterGiveawayButton = new ButtonBuilder()
			.setCustomId(`enter-giveaway-${giveaway.giveawayId}`)
			.setLabel("Enter")
			.setStyle(ButtonStyle.Success)
			.setEmoji("🎁");

		if (i.customId === "publishGiveaway") {
			if (!i.replied) {
				await i.deferUpdate().catch(console.error);
			}

			const channelSelectMenu = new ChannelSelectMenuBuilder()
				.setCustomId("channelSelect")
				.setMinValues(1)
				.setMaxValues(1)
				.setChannelTypes(
					ChannelType.GuildText,
					ChannelType.GuildAnnouncement
				);

			const chooseChannelStr =
				"Select the channel you would like to publish the giveaway in.";

			const row1 =
				new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
					channelSelectMenu
				);

			const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
				backButton
			);

			const updateMsg = await i.editReply({
				content: chooseChannelStr,
				components: [row1, row2],
				embeds: [await formatGiveaway(giveaway, true)]
			});

			const component = await updateMsg.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id
			});

			if (component.customId === "back") {
				dashboard(interaction, giveawayManager, id);

				return;
			}

			if (component.customId === "channelSelect") {
				if (!component.isChannelSelectMenu()) {
					i.editReply({
						content: "⚠️ Something went wrong. Try again.",
						components: [],
						embeds: []
					});

					return;
				}

				const channelId = component.values[0];
				const channel = interaction.guild.channels.cache.get(
					channelId
				) as NewsChannel | TextChannel | undefined;

				if (!channel) {
					i.editReply({
						content: "⚠️ This channel does not exist.",
						components: [],
						embeds: []
					});

					return;
				}

				const msg = await channel.send({
					embeds: [await formatGiveaway(giveaway, true)],
					components: [
						new ActionRowBuilder<ButtonBuilder>().setComponents(
							enterGiveawayButton
						)
					]
				});

				i.editReply({
					content: `✨ Done! Giveaway published in ${channel}.`,
					components: [],
					embeds: []
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

			return;
		}

		if (i.customId === "republishGiveaway") {
			if (!i.replied) {
				await i.deferUpdate().catch(console.error);
			}

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
					
					${
						giveaway.channelId
							? `Previous channel: <#${giveaway.channelId}> (${giveaway.channelId})`
							: ""
					}
				`;

			const lastChannelButton = new ButtonBuilder()
				.setCustomId("lastChannel")
				.setLabel("Use the previous channel")
				.setStyle(ButtonStyle.Primary);

			const row1 =
				new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
					channelSelectMenu
				);

			const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
				backButton,
				lastChannelButton
			);

			const updateMsg = await i.editReply({
				content: chooseChannelStr,
				components: [row1, row2],
				embeds: [await formatGiveaway(giveaway, true)]
			});

			const component = await updateMsg.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id
			});

			if (component.customId === "back") {
				dashboard(interaction, giveawayManager, id);

				return;
			}

			if (
				component.customId === "channelSelect" ||
				component.customId === "lastChannel"
			) {
				const channelId = !component.isChannelSelectMenu()
					? giveaway.channelId
					: component.values[0];

				if (!channelId) {
					i.editReply({
						content: "⚠️ Something went wrong. Try again.",
						components: [],
						embeds: []
					});

					return;
				}

				const channel = interaction.guild.channels.cache.get(
					channelId
				) as NewsChannel | TextChannel | undefined;

				if (!channel) {
					i.editReply({
						content: "⚠️ This channel does not exist.",
						components: [],
						embeds: []
					});

					return;
				}

				const msg = await channel.send({
					content: giveaway.rolesToPing
						.map((roleId) => `<@&${roleId}>`)
						.join(" "),
					allowedMentions: {
						roles: giveaway.rolesToPing
					},
					embeds: [await formatGiveaway(giveaway, true)],
					components: [
						new ActionRowBuilder<ButtonBuilder>().setComponents(
							enterGiveawayButton
						)
					]
				});

				const oldChannel = i.guild.channels.cache.get(
					giveaway.channelId ?? ""
				);

				if (oldChannel?.isTextBased() && giveaway.messageId) {
					oldChannel.messages
						.delete(giveaway.messageId)
						.catch(() => null);
				}

				i.editReply({
					content: `✨ Done! Giveaway published in ${channel}.`,
					components: [],
					embeds: []
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

			return;
		}

		if (i.customId === "giveawayEditButton") {
			const editGiveawayModal = giveawayComponents.edit.editOptionsModal(
				giveaway.giveawayId,
				giveaway.giveawayTitle,
				giveaway.giveawayDescription,
				giveaway.numberOfWinners
			);

			await i.showModal(editGiveawayModal);

			const modalResponse = await i
				.awaitModalSubmit({
					filter: (interaction) =>
						interaction.customId === "giveawayEdit",
					time: 180_000
				})
				.catch(async () => {
					await i.editReply({
						content:
							"Something went wrong. The time limit is 3 minutes. Try again!"
					});
				});

			if (!modalResponse) {
				return;
			}

			await modalResponse.deferUpdate();

			const giveawayManager = new GiveawayManager(interaction.guildId);

			const giveawayTitle =
				modalResponse.fields.getTextInputValue("new-title");

			const giveawayDescription =
				modalResponse.fields.getTextInputValue("new-description");

			const numberOfWinners =
				Number(
					modalResponse.fields.getTextInputValue(
						"new-number-of-winners"
					)
				) ?? 1;

			await giveawayManager.edit({
				where: {
					giveawayId: id
				},
				data: {
					giveawayTitle,
					giveawayDescription,
					numberOfWinners,
					lastEditedTimestamp: Date.now().toString(),
					lastEditedUserId: i.user.id,
					lastEditedUserTag: i.user.tag
				}
			});

			await dashboard(interaction, giveawayManager, id);

			return;
		}

		if (i.customId === "setRequiredRoles") {
			if (!i.replied) {
				await i.deferUpdate().catch(console.error);
			}

			const requiredRolesSelect = new RoleSelectMenuBuilder()
				.setCustomId("requiredRolesSelect")
				.setMinValues(1)
				.setMaxValues(10);

			const chooseRequiredRoleStr = stripIndents`
					Select the roles you require entrants to have.
					
					Currently set to: ${
						giveaway.requiredRoles.length
							? listify(
									giveaway.requiredRoles.map(
										(roleId) => `<@&${roleId}>`
									),
									{ length: 5 }
							  )
							: "No roles"
					}
				`;

			const clearRequiredRolesButton =
				giveawayComponents.dashboard.clearRequiredRolesButton();

			const row1 =
				new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
					requiredRolesSelect
				);

			const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
				clearRequiredRolesButton
			);

			const updateMsg = await i.editReply({
				content: chooseRequiredRoleStr,
				components: [row1, row2]
			});

			const component = await updateMsg.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id
			});

			if (component.customId === "requiredRolesSelect") {
				if (!component.isRoleSelectMenu()) {
					return;
				}

				await component.deferUpdate();

				await giveawayManager.edit({
					where: {
						giveawayId: giveaway.giveawayId
					},
					data: {
						requiredRoles: component.values
					}
				});
			} else if (component.customId === "clearRequiredRoles") {
				await component.deferUpdate();

				await giveawayManager.edit({
					where: {
						giveawayId: giveaway.giveawayId
					},
					data: {
						requiredRoles: []
					}
				});
			}

			await dashboard(interaction, giveawayManager, id);

			return;
		}

		if (i.customId === "setPingRoles") {
			if (!i.replied) {
				await i.deferUpdate().catch(console.error);
			}

			const pingRolesSelect = new RoleSelectMenuBuilder()
				.setCustomId("pingRolesSelect")
				.setMinValues(1)
				.setMaxValues(10);

			const choosePingRoleStr = stripIndents`
					Select the roles you want to ping when publishing the giveaway.
					
					Currently set to: ${
						giveaway.rolesToPing.length
							? listify(
									giveaway.rolesToPing.map(
										(roleId) => `<@&${roleId}>`
									),
									{ length: 5 }
							  )
							: "No roles"
					}
				`;

			const clearPingRolesButton =
				giveawayComponents.dashboard.clearPingRolesButton();

			const row1 =
				new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
					pingRolesSelect
				);

			const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
				clearPingRolesButton
			);

			const updateMsg = await i.editReply({
				content: choosePingRoleStr,
				components: [row1, row2]
			});

			const component = await updateMsg.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id
			});

			if (component.customId === "pingRolesSelect") {
				if (!component.isRoleSelectMenu()) {
					return;
				}

				await component.deferUpdate();

				await giveawayManager.edit({
					where: {
						giveawayId: giveaway.giveawayId
					},
					data: {
						rolesToPing: component.values
					}
				});
			} else if (component.customId === "clearRequiredRoles") {
				await component.deferUpdate();

				await giveawayManager.edit({
					where: {
						giveawayId: giveaway.giveawayId
					},
					data: {
						rolesToPing: []
					}
				});
			}

			await dashboard(interaction, giveawayManager, id);

			return;
		}

		("");
	});
};

export default async function (
	interaction:
		| ChatInputCommandInteraction<"cached">
		| ModalSubmitInteraction<"cached">,
	customId?: number
) {
	if (interaction.isModalSubmit() && !customId) {
		return;
	}

	const id = interaction.isModalSubmit()
		? customId!
		: interaction.options.getInteger("giveaway", true);

	const giveawayManager = new GiveawayManager(interaction.guildId);

	await dashboard(interaction, giveawayManager, id);
}
