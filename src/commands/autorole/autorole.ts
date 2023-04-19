import components from "#components";
import { HIDE_OPTION } from "#constants";
import AutoroleManager from "#database/autorole.js";
import Logger from "#logger";
import {
	type CommandData,
	type CommandExport,
	type CommandModuleInteractions
} from "#typings";
import { oneLine } from "common-tags";
import { PermissionFlagsBits } from "discord.js";

const data: CommandData = {
	chatInput: {
		name: "autorole",
		dm_permission: false,
		description:
			"Configuration for giving joining members specific roles automatically.",
		default_member_permissions: (
			PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild
		).toString(),
		options: [HIDE_OPTION]
	}
};

const chatInput = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const hide = interaction.options.getBoolean("hide") ?? true;

	await interaction.deferReply({ ephemeral: hide });

	const autoroleManager = new AutoroleManager(interaction.guild);
	await autoroleManager.initialize();

	const logger = new Logger({ label: "AUTOROLE", interaction });

	const dashboard = async () => {
		const autorole = await autoroleManager.get();

		const rows = components.createRows(
			components.selectMenus.role,
			components.buttons.clear.component("roles"),
			autorole.activated
				? components.buttons.disable
				: components.buttons.enable
		);

		const msg = await interaction.editReply({
			components: rows,
			embeds: [autorole.toEmbed()]
		});

		const collector = msg.createMessageComponentCollector({
			filter: (i) => i.user.id === interaction.user.id,
			time: 60_000,
			// if it is max: 1 like it should be the "end" event gets
			// fired before "collect" and it's just a pain
			max: 2
		});

		collector.on("collect", async (i) => {
			await i.deferUpdate();

			let active = autorole.activated;
			let rolesIdsArray = [...autorole.roleIds];

			if (i.customId === components.selectMenus.role.customId) {
				if (!i.isRoleSelectMenu()) {
					return;
				}

				rolesIdsArray = i.values;

				logger.log(
					oneLine`
						Roles changed from
						[${[...autorole.roleIds].join(", ")}]
						to [${rolesIdsArray.join(", ")}]
					`
				);
			} else if (i.customId === components.buttons.clear.customId) {
				rolesIdsArray = [];

				logger.log(
					oneLine`
						Roles changed from
						[${[...autorole.roleIds].join(", ")}]
						to [${rolesIdsArray.join(", ")}]
					`
				);
			} else if (i.customId === components.buttons.enable.customId) {
				active = true;

				logger.log("Activated autorole");
			} else if (i.customId === components.buttons.disable.customId) {
				active = false;
				logger.log("Deactivated autorole");
			}

			await autoroleManager.update({
				activated: active,
				roleIds: rolesIdsArray
			});

			collector.stop("stop");
		});

		collector.on("end", async (_, reason) => {
			if (reason === "time") {
				await interaction
					.editReply({
						components: []
					})
					.catch(() => null);

				return;
			}

			await dashboard();
		});
	};

	await dashboard();
};

export const getCommand: () => CommandExport = () => ({
	data,
	handle: {
		chatInput
	}
});
