import components from "#components";
import { Emojis } from "#constants";
import ConfigManager from "#database/config.js";
import prisma from "#database/prisma.js";
import yesNo from "#helpers/yesNo.js";
import Logger from "#logger";
import {
	ChannelType,
	ComponentType,
	type ButtonInteraction,
	type ChatInputCommandInteraction
} from "discord.js";
import handleConfigOption from "./dashboardModules/handleConfigOption.js";
import handleFullConfigOption from "./dashboardModules/handleFullConfigOption.js";
import toNoConfigDashboard from "./noConfigDashboard.js";

const channelTypes = [
	ChannelType.GuildText,
	ChannelType.GuildAnnouncement,
	ChannelType.PrivateThread,
	ChannelType.PublicThread
];

export default async function toConfigDashboard(
	interaction:
		| ButtonInteraction<"cached">
		| ChatInputCommandInteraction<"cached">,
	configManager: ConfigManager
) {
	let config = await configManager.get();

	const logger = new Logger({ interaction, prefix: "CONFIG" });

	const embed = config.toEmbed();

	const {
		caseLogOptions,
		memberLogOptions,
		messageLogOptions,
		pinArchiveOptions,
		protectedChannelsOptions,
		reportChannelOptions,
		reset,
		restrictRolesOptions
	} = components.buttons;

	const rows = [
		...components.createRows(
			caseLogOptions,
			memberLogOptions,
			reportChannelOptions,
			messageLogOptions
		),
		...components.createRows(
			pinArchiveOptions,
			protectedChannelsOptions,
			restrictRolesOptions
		),
		...components.createRows(reset.component("config"))
	];

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
		await buttonInteraction.deferUpdate();

		const retry = async () => {
			switch (buttonInteraction.customId) {
				case caseLogOptions.customId: {
					handleFullConfigOption(buttonInteraction, config, {
						type: "caseLog",
						channelTypes
					})
						.then(async (res) => {
							logger.log("Edited case log");

							config = await config.edit({
								caseLogChannelId: res.channelId,
								caseLogEnabled: res.enabled
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}

				case memberLogOptions.customId: {
					handleFullConfigOption(buttonInteraction, config, {
						type: "memberLog",
						channelTypes
					})
						.then(async (res) => {
							logger.log("Edited member log");

							config = await config.edit({
								memberLogChannelId: res.channelId,
								memberLogEnabled: res.enabled
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}

				case messageLogOptions.customId: {
					handleFullConfigOption(buttonInteraction, config, {
						type: "messageLog",
						channelTypes
					})
						.then(async (res) => {
							logger.log("Edited message log");

							config = await config.edit({
								messageLogChannelId: res.channelId,
								messageLogEnabled: res.enabled
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}

				case reportChannelOptions.customId: {
					handleFullConfigOption(buttonInteraction, config, {
						type: "report",
						channelTypes: [...channelTypes, ChannelType.GuildForum]
					})
						.then(async (res) => {
							logger.log("Edited report option");

							config = await config.edit({
								reportChannelId: res.channelId,
								reportEnabled: res.enabled
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}

				case pinArchiveOptions.customId: {
					handleConfigOption
						.channels(buttonInteraction, config, {
							channelTypes,
							id: "pinArchiveChannelId",
							max: 1,
							min: 1,
							name: "Pin archive"
						})
						.then(async (res) => {
							logger.log("Edited pin archive option");

							config = await config.edit({
								pinArchiveChannelId:
									res.channelIds.at(0) || null
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}

				case protectedChannelsOptions.customId: {
					handleConfigOption
						.channels(buttonInteraction, config, {
							id: "protectedChannelsIds",
							name: "Protected channels",
							channelTypes: [
								...channelTypes,
								ChannelType.GuildCategory,
								ChannelType.GuildForum,
								ChannelType.AnnouncementThread,
								ChannelType.GuildVoice,
								ChannelType.GuildStageVoice
							],
							min: 1,
							max: 25
						})
						.then(async (res) => {
							logger.log("Edited protected channels option");

							config = await config.edit({
								protectedChannelsIds: res.channelIds
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}

				case reset.customId: {
					const confirmation = await yesNo({
						medium: buttonInteraction,
						data: {
							embeds: [],
							content: `${Emojis.Warn} Are you sure you want to reset the config?`
						}
					})
						.then(() => true)
						.catch(() => false);

					if (!confirmation) {
						await buttonInteraction.followUp({
							ephemeral: true,
							content: `${Emojis.V} Cancelled resetting the config.`
						});

						toConfigDashboard(buttonInteraction, configManager);

						return;
					}

					await prisma.$transaction([
						prisma.config.delete({
							where: { guildId: interaction.guildId }
						}),
						prisma.config.create({
							data: { guildId: interaction.guildId }
						})
					]);

					logger.log("Reset config");

					buttonInteraction.followUp({
						ephemeral: true,
						content: `${Emojis.Sparks} Successfully reset the config.`
					});

					const newConfigManager = new ConfigManager(
						interaction.guild
					);

					await newConfigManager
						.validate()
						.then(async () =>
							toConfigDashboard(interaction, newConfigManager)
						)
						.catch(async () =>
							toNoConfigDashboard(interaction, newConfigManager)
						);

					return;
				}

				case restrictRolesOptions.customId: {
					handleConfigOption
						.roles(buttonInteraction, config, {
							type: "restrictRoles"
						})
						.then(async (res) => {
							logger.log("Edited restrict roles option");

							config = await config.edit({
								restrictRolesIds: res.roleIds
							});

							retry();
						})
						.catch(async () =>
							toConfigDashboard(buttonInteraction, configManager)
						);

					break;
				}
			}
		};

		retry();
	});

	collector.on("end", (_, reason) => {
		if (reason === "time") {
			interaction.editReply({ components: [] }).catch(() => null);
		}
	});
}
