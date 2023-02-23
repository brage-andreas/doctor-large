import components from "#components";
import AutoroleManager from "#database/autorole.js";
import Logger from "#logger";
import { type Command, type CommandModuleInteractions } from "#typings";
import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	PermissionFlagsBits,
	type ButtonBuilder,
	type RESTPostAPIApplicationCommandsJSONBody,
	type RoleSelectMenuBuilder
} from "discord.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "autorole",
	dm_permission: false,
	description:
		"Configuration for giving joining members specific roles automatically.",
	default_member_permissions: (
		PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild
	).toString()
};

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const autoroleManager = new AutoroleManager(interaction.guild);
	await autoroleManager.initialize();

	const logger = new Logger({ prefix: "AUTOROLE" });

	const dashboard = async () => {
		const autorole = await autoroleManager.get();

		const { clear: clearRoles, disable, enable } = components.buttons;
		const { roleSelect } = components.selects;

		const row1 =
			new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
				roleSelect.component(1, 10)
			);

		const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
			clearRoles.component(),
			autorole.activated ? disable.component() : enable.component()
		);

		const msg = await interaction.editReply({
			components: [row1, row2],
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

			logger.setInteraction(i);

			let active = autorole.activated ?? false;
			let roles = [...autorole.roleIds];

			if (i.customId === roleSelect.customId) {
				if (!i.isRoleSelectMenu()) {
					return;
				}

				roles = i.values;

				logger.log(
					oneLine`
						Roles changed from
						[${[...autorole.roleIds].join(", ")}]
						to [${roles.join(", ")}]
					`
				);
			} else if (i.customId === clearRoles.customId) {
				roles = [];

				logger.log(
					oneLine`
						Roles changed from
						[${[...autorole.roleIds].join(", ")}]
						to [${roles.join(", ")}]
					`
				);
			} else if (i.customId === enable.customId) {
				active = true;

				logger.log("Activated autorole");
			} else if (i.customId === disable.customId) {
				active = false;
				logger.log("Deactivated autorole");
			}

			await autoroleManager.update({
				activated: active,
				roleIds: roles
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

export const getCommand: () => Command = () => ({
	data,
	run
});
