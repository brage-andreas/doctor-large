import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	PermissionFlagsBits,
	type RESTPostAPIApplicationCommandsJSONBody,
	type Role
} from "discord.js";
import AutoroleManager from "../database/autorole.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../typings/index.js";

// TODO: REFACTOR

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "autorole",
	dm_permission: false,
	description:
		"Configuration for giving joining members specific roles automatically.",
	default_member_permissions: (
		PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild
	).toString(),
	options: [
		{
			name: "toggle",
			description: "Toogle autorole on or off.",
			type: ApplicationCommandOptionType.Subcommand
		},
		{
			name: "edit-roles",
			description: "Edit which roles the autorole should apply.",
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: "role-1",
					type: ApplicationCommandOptionType.Role,
					description:
						"A role which will be applied by the autorole [None]"
				},
				{
					name: "role-2",
					type: ApplicationCommandOptionType.Role,
					description:
						"A role which will be applied by the autorole [None]"
				},
				{
					name: "role-3",
					type: ApplicationCommandOptionType.Role,
					description:
						"A role which will be applied by the autorole [None]"
				},
				{
					name: "role-4",
					type: ApplicationCommandOptionType.Role,
					description:
						"A role which will be applied by the autorole [None]"
				},
				{
					name: "role-5",
					type: ApplicationCommandOptionType.Role,
					description:
						"A role which will be applied by the autorole [None]"
				},
				{
					name: "role-6",
					type: ApplicationCommandOptionType.Role,
					description:
						"A role which will be applied by the autorole [None]"
				}
			]
		}
	]
};

const turnOnButton = new ButtonBuilder()
	.setLabel("Toggle autorole on")
	.setCustomId("enable")
	.setStyle(ButtonStyle.Success);

const turnOffButton = new ButtonBuilder()
	.setLabel("Toggle autorole off")
	.setCustomId("disable")
	.setStyle(ButtonStyle.Danger);

const undoButton = new ButtonBuilder()
	.setLabel("Undo and use previous roles")
	.setCustomId("undo")
	.setStyle(ButtonStyle.Danger);

const undidButton = new ButtonBuilder()
	.setLabel("Undid roles!")
	.setCustomId("undid")
	.setStyle(ButtonStyle.Success)
	.setDisabled(true);

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	await interaction.deferReply();

	const option = interaction.options.getSubcommand();

	const autoroleManager = new AutoroleManager(interaction.guildId);

	if (option === "toggle") {
		const reply = async () => {
			const autoroleData = await autoroleManager.get();
			const on = Boolean(autoroleData?.activated);

			const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
				on ? turnOffButton : turnOnButton
			);

			const hasManageRolesPermission =
				interaction.guild.members.me?.permissions.has(
					PermissionFlagsBits.ManageRoles
				) ?? false;

			const description = on
				? "<:ON:1047914157409828934> Currently toggled **on**"
				: "<:OFF:1047914155929256026> Currently toggled **off**";

			const roles = autoroleData?.roleIds.length
				? autoroleData.roleIds
						.map((roleId, i) => {
							const role =
								interaction.guild.roles.cache.get(roleId);

							if (!role) {
								return `⚠️ Could not find role (${roleId})`;
							}

							return `${i + 1}. ${role} (${role.id})`;
						})
						.join("\n")
				: "No roles";

			const embed = new EmbedBuilder()
				.setTitle("Autorole")
				.setDescription(
					hasManageRolesPermission
						? description
						: `${description}\n\n⚠️ Missing Manage Roles permission`
				)
				.setTimestamp(
					autoroleData?.discordTimestamp
						? Number(autoroleData.discordTimestamp)
						: undefined
				);

			if (autoroleData?.moderatorTag && autoroleData.moderatorId) {
				embed.setFooter({
					text: `Last edited by ${autoroleData?.moderatorTag} (${autoroleData?.moderatorId})`
				});
			}

			if (on) {
				embed.addFields({
					name: "Current roles",
					value: roles,
					inline: true
				});
			}

			const msg = await interaction.editReply({
				embeds: [embed],
				components: [row]
			});

			const collector = msg.createMessageComponentCollector({
				filter: (i) => i.user.id === interaction.user.id,
				componentType: ComponentType.Button,
				time: 30_000,
				max: 1
			});

			collector.on("collect", async (i) => {
				await i.deferUpdate();

				if (i.customId === "enable") {
					await autoroleManager.set({
						activated: true,

						guildId: i.guildId,
						discordTimestamp: Date.now().toString(),
						moderatorId: i.user.id,
						moderatorTag: i.user.tag,
						roleIds: autoroleData?.roleIds
					});
				} else if (i.customId === "disable") {
					await autoroleManager.set({
						activated: false,

						guildId: i.guildId,
						discordTimestamp: Date.now().toString(),
						moderatorId: i.user.id,
						moderatorTag: i.user.tag,
						roleIds: autoroleData?.roleIds
					});
				}

				collector.stop("stop");
				reply();
			});

			collector.on("end", async (_, reason) => {
				if (reason !== "time") {
					return;
				}

				await interaction.editReply({ components: [] });
			});
		};

		reply();
	} else if (option === "edit-roles") {
		const autoroleData = await autoroleManager.get();
		let on = Boolean(autoroleData?.activated);

		const createEmbedContent = (
			oldRoleIds: Array<string>,
			newRoleIds: Array<string>,
			description: string,
			toggledOff = false
		) => {
			const [oldRoles, newRoles] = [oldRoleIds, newRoleIds].map(
				(roleIds) =>
					roleIds.length
						? roleIds
								.map((roleId, i) => {
									const role =
										interaction.guild.roles.cache.get(
											roleId
										);

									if (!role) {
										return `⚠️ Could not find role (${roleId})`;
									}

									return `${i + 1}. ${role} (${role.id})`;
								})
								.join("\n")
						: "No roles"
			);

			const embed = new EmbedBuilder()
				.setTitle("Autorole")
				.addFields(
					{ name: "Old Roles", value: oldRoles, inline: true },
					{ name: "New Roles", value: newRoles, inline: true }
				)
				.setTimestamp(
					autoroleData?.discordTimestamp
						? Number(autoroleData.discordTimestamp)
						: undefined
				);

			if (autoroleData?.moderatorTag && autoroleData.moderatorId) {
				embed.setFooter({
					text: `Last edited by ${autoroleData?.moderatorTag} (${autoroleData?.moderatorId})`
				});
			}

			if (toggledOff) {
				embed.setDescription(
					`⚠️ Autorole is turned off!\n\n${description}`
				);
			} else {
				embed.setDescription(description);
			}

			return embed;
		};

		const newRoles = [1, 2, 3, 4, 5, 6]
			.map((n) => interaction.options.getRole(`role-${n}`))
			.filter((roleOrNull) => Boolean(roleOrNull)) as Array<Role>;

		const newRoleIds = newRoles.map((role) => role.id);

		autoroleManager.set({
			activated: autoroleData?.activated ?? false,
			guildId: interaction.guildId,
			discordTimestamp: Date.now().toString(),
			moderatorId: interaction.user.id,
			moderatorTag: interaction.user.tag,
			roleIds: newRoleIds
		});

		const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
			JSON.stringify(autoroleData?.roleIds ?? []) ===
				JSON.stringify(newRoleIds)
				? undoButton.setDisabled(true)
				: undoButton.setDisabled(false)
		);

		if (!on) {
			row.addComponents(turnOnButton);
		}

		const embed = createEmbedContent(
			autoroleData?.roleIds ?? [],
			newRoleIds,
			"Done! Autorole roles are now updated.",
			!on
		);

		const msg = await interaction.editReply({
			components: [row],
			embeds: [embed]
		});

		const collector = msg.createMessageComponentCollector({
			filter: (i) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			time: 30_000,
			max: 2
		});

		collector.on("collect", async (i) => {
			await i.deferUpdate();

			if (i.customId === "enable") {
				await autoroleManager.set({
					activated: true,
					guildId: i.guildId,
					discordTimestamp: Date.now().toString(),
					moderatorId: i.user.id,
					moderatorTag: i.user.tag,
					roleIds: (await autoroleManager.get())?.roleIds ?? []
				});

				on = true;

				if (row.components.length === 2) {
					row.setComponents(undoButton);
				} else {
					row.setComponents([]);
				}

				const embed = createEmbedContent(
					autoroleData?.roleIds ?? [],
					newRoleIds,
					"Done! Autorole roles are now updated.",
					false
				);

				await i.editReply({
					components: [row],
					embeds: [embed]
				});
			} else if (i.customId === "undo") {
				await autoroleManager.set({
					activated:
						(await autoroleManager.get())?.activated ?? false,
					guildId: i.guildId,
					discordTimestamp: Date.now().toString(),
					moderatorId: i.user.id,
					moderatorTag: i.user.tag,
					roleIds: autoroleData?.roleIds
				});

				if (!on) {
					row.setComponents(undidButton, turnOnButton);
				} else {
					row.setComponents(undidButton);
				}

				const embed = createEmbedContent(
					[],
					autoroleData?.roleIds ?? [],
					"Done! Undid autorole roles.",
					!on
				);

				await i.editReply({
					components: [row],
					embeds: [embed]
				});
			}
		});

		collector.on("end", async (_, reason) => {
			if (reason !== "time") {
				return;
			}

			await interaction.editReply({ components: [] });
		});
	}
};

export const getCommand: () => Command = () => ({
	data,
	run
});
