import { type ButtonInteraction, ChannelType, type ChatInputCommandInteraction, ComponentType } from "discord.js";
import handlePartialConfigOption from "./modules/partial-config-option-handle.js";
import handleFullConfigOption from "./modules/full-config-option-handle.js";
import toCreateConfig from "../create-config.js";
import ConfigManager from "#database/config.js";
import components from "#discord-components";
import prisma from "#database/prisma.js";
import { Emojis } from "#constants";
import { yesNo } from "#helpers";
import Logger from "#logger";

const channelTypes = [
	ChannelType.GuildText,
	ChannelType.GuildAnnouncement,
	ChannelType.PrivateThread,
	ChannelType.PublicThread,
];

export default async function toConfigDashboard(
	interaction: ButtonInteraction<"cached"> | ChatInputCommandInteraction<"cached">,
	configManager: ConfigManager
) {
	let config = await configManager.get();

	const logger = new Logger({ interaction, label: "CONFIG" });

	const embed = config.toEmbed();

	const rows = components.createRows.uniform(2)(
		components.buttons.caseLogOptions,
		components.buttons.restrictRolesOptions,

		components.buttons.memberLogOptions,
		components.buttons.pinArchiveOptions,

		components.buttons.messageLogOptions,
		components.buttons.protectedChannelsOptions,

		components.buttons.reportChannelOptions,
		components.buttons.reset.component("config")
	);

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
		await buttonInteraction.deferUpdate();

		const retry = async () => {
			switch (buttonInteraction.customId) {
				case components.buttons.caseLogOptions.customId: {
					handleFullConfigOption(buttonInteraction, config, "caseLog", channelTypes)
						.then(async (option) => {
							logger.log("Edited case log");

							config = await config.edit({
								caseLogChannelId: option.channelId,
								caseLogEnabled: option.enabled,
							});

							void retry();
						})
						.catch(async () => toConfigDashboard(buttonInteraction, configManager));

					break;
				}

				case components.buttons.memberLogOptions.customId: {
					const option = await handleFullConfigOption(
						buttonInteraction,
						config,
						"memberLog",
						channelTypes
					).catch(() => null);

					if (!option) {
						void toConfigDashboard(buttonInteraction, configManager);

						return;
					}

					logger.log("Edited member log");

					config = await config.edit({
						memberLogChannelId: option.channelId,
						memberLogEnabled: option.enabled,
					});

					void retry();

					break;
				}

				case components.buttons.messageLogOptions.customId: {
					const option = await handleFullConfigOption(
						buttonInteraction,
						config,
						"messageLog",
						channelTypes
					).catch(() => null);

					if (!option) {
						void toConfigDashboard(buttonInteraction, configManager);

						return;
					}

					logger.log("Edited message log");

					config = await config.edit({
						messageLogChannelId: option.channelId,
						messageLogEnabled: option.enabled,
					});

					void retry();

					break;
				}

				case components.buttons.reportChannelOptions.customId: {
					const option = await handleFullConfigOption(buttonInteraction, config, "report", [
						...channelTypes,
						ChannelType.GuildForum,
					]).catch(() => null);

					if (!option) {
						void toConfigDashboard(buttonInteraction, configManager);

						return;
					}

					logger.log("Edited report option");

					config = await config.edit({
						reportChannelId: option.channelId,
						reportEnabled: option.enabled,
					});

					void retry();

					break;
				}

				case components.buttons.pinArchiveOptions.customId: {
					handlePartialConfigOption
						.channels(buttonInteraction, config, {
							channelTypes,
							checkPermissions: true,
							id: "pinArchiveChannelId",
							max: 1,
							min: 1,
							name: "Pin archive",
						})
						.then(async (option) => {
							logger.log("Edited pin archive option");

							config = await config.edit({
								pinArchiveChannelId: option.channelIds.at(0) ?? null,
							});

							void retry();
						})
						.catch(async () => toConfigDashboard(buttonInteraction, configManager));

					break;
				}

				case components.buttons.protectedChannelsOptions.customId: {
					handlePartialConfigOption
						.channels(buttonInteraction, config, {
							channelTypes: [
								...channelTypes,
								ChannelType.GuildCategory,
								ChannelType.GuildForum,
								ChannelType.AnnouncementThread,
								ChannelType.GuildVoice,
								ChannelType.GuildStageVoice,
							],
							id: "protectedChannelsIds",
							max: 25,
							min: 1,
							name: "Protected channels",
						})
						.then(async (option) => {
							logger.log("Edited protected channels option");

							config = await config.edit({
								protectedChannelsIds: option.channelIds,
							});

							void retry();
						})
						.catch(async () => toConfigDashboard(buttonInteraction, configManager));

					break;
				}

				case components.buttons.reset.customId: {
					const confirmation = await yesNo({
						data: {
							content: `${Emojis.Warn} Are you sure you want to reset the config?`,
							embeds: [],
						},
						medium: buttonInteraction,
					})
						.then(() => true)
						.catch(() => false);

					if (!confirmation) {
						await buttonInteraction.followUp({
							content: `${Emojis.Check} Canceled resetting the config.`,
							ephemeral: true,
						});

						void toConfigDashboard(buttonInteraction, configManager);

						return;
					}

					await prisma.$transaction([
						prisma.config.delete({
							where: { guildId: interaction.guildId },
						}),
						prisma.config.create({
							data: { guildId: interaction.guildId },
						}),
					]);

					logger.log("Reset config");

					buttonInteraction
						.followUp({
							content: `${Emojis.Sparks} Successfully reset the config.`,
							ephemeral: true,
						})
						.catch(() => null);

					const newConfigManager = new ConfigManager(interaction.guild);

					await newConfigManager
						.validate()
						.then(async () => toConfigDashboard(interaction, newConfigManager))
						.catch(async () => toCreateConfig(interaction, newConfigManager));

					return;
				}

				case components.buttons.restrictRolesOptions.customId: {
					handlePartialConfigOption
						.roles(buttonInteraction, config, {
							type: "restrictRoles",
						})
						.then(async (option) => {
							logger.log("Edited restrict roles option");

							config = await config.edit({
								restrictRolesIds: option.roleIds,
							});

							void retry();
						})
						.catch(async () => toConfigDashboard(buttonInteraction, configManager));

					break;
				}
			}
		};

		void retry();
	});

	collector.on("end", (_, reason) => {
		if (reason === "time") {
			interaction.editReply({ components: [] }).catch(() => null);
		}
	});
}
