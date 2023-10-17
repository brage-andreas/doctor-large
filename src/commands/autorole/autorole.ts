import { type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { type CommandData, type CommandExport } from "#typings";
import AutoroleManager from "#database/autorole.js";
import components from "#discord-components";
import { HIDE_OPTION } from "#constants";
import { oneLine } from "common-tags";
import Logger from "#logger";

const data: CommandData = {
	chatInput: {
		default_member_permissions: (PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild).toString(),
		description: "Configuration for giving joining members specific roles automatically.",
		dm_permission: false,
		name: "autorole",
		options: [HIDE_OPTION],
	},
};

const chatInput = async (interaction: ChatInputCommandInteraction<"cached">) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const hide = interaction.options.getBoolean("hide") ?? true;

	await interaction.deferReply({ ephemeral: hide });

	const autoroleManager = new AutoroleManager(interaction.guild);
	await autoroleManager.initialize();

	const logger = new Logger({ interaction, label: "AUTOROLE" });

	const dashboard = async () => {
		const autorole = await autoroleManager.get();

		const rows = components.createRows(
			components.selectMenus.role,
			components.buttons.clear.component("roles"),
			autorole.activated ? components.buttons.disable : components.buttons.enable
		);

		const message = await interaction.editReply({
			components: rows,
			embeds: [autorole.toEmbed()],
		});

		const collector = message.createMessageComponentCollector({
			filter: (index) => index.user.id === interaction.user.id,
			max: 2,
			time: 60_000,
		});

		collector.on("collect", async (index) => {
			await index.deferUpdate();

			let active = autorole.activated;
			let rolesIdsArray = [...autorole.roleIds];

			switch (index.customId) {
				case components.selectMenus.role.customId: {
					if (!index.isRoleSelectMenu()) {
						return;
					}

					rolesIdsArray = index.values;

					logger.log(
						oneLine`
							Roles changed from
							[${[...autorole.roleIds].join(", ")}]
							to [${rolesIdsArray.join(", ")}]
						`
					);

					break;
				}

				case components.buttons.clear.customId: {
					rolesIdsArray = [];

					logger.log(
						oneLine`
							Roles changed from
							[${[...autorole.roleIds].join(", ")}]
							to [${rolesIdsArray.join(", ")}]
						`
					);

					break;
				}

				case components.buttons.enable.customId: {
					active = true;

					logger.log("Activated autorole");

					break;
				}

				case components.buttons.disable.customId: {
					active = false;
					logger.log("Deactivated autorole");

					break;
				}
			}

			await autoroleManager.update({
				activated: active,
				roleIds: rolesIdsArray,
			});

			collector.stop("stop");
		});

		collector.on("end", async (_, reason) => {
			if (reason === "time") {
				await interaction
					.editReply({
						components: [],
					})
					.catch(() => null);

				return;
			}

			await dashboard();
		});
	};

	await dashboard();
};

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		chatInput,
	},
});
