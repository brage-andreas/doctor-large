import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	RoleSelectMenuBuilder,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import AutoroleManager from "../../database/autorole.js";
import Logger from "../../logger/logger.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../../typings/index.js";
import formatAutorole from "./mod.autorole.format.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "autorole",
	dm_permission: false,
	description:
		"Configuration for giving joining members specific roles automatically.",
	default_member_permissions: (
		PermissionFlagsBits.ManageRoles | PermissionFlagsBits.ManageGuild
	).toString()
};

const turnOnButton = new ButtonBuilder()
	.setLabel("Toggle autorole on")
	.setCustomId("autoroleEnable")
	.setStyle(ButtonStyle.Success);

const turnOffButton = new ButtonBuilder()
	.setLabel("Toggle autorole off")
	.setCustomId("autoroleDisable")
	.setStyle(ButtonStyle.Danger);

const roleSelect = new RoleSelectMenuBuilder()
	.setCustomId("autoroleSelect")
	.setMinValues(1)
	.setMaxValues(10);

const clearRolesButton = new ButtonBuilder()
	.setCustomId("autoroleClear")
	.setStyle(ButtonStyle.Secondary)
	.setLabel("Clear roles");

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	await interaction.deferReply();

	const autoroleManager = new AutoroleManager(interaction.guildId);

	const logger = new Logger({ prefix: "AUTOROLE" });

	const dashboard = async () => {
		const data = await autoroleManager.get();

		const row1 =
			new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
				roleSelect
			);

		const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
			clearRolesButton,
			data.activated ? turnOffButton : turnOnButton
		);

		const msg = await interaction.editReply({
			components: [row1, row2],
			embeds: [formatAutorole(interaction, data)]
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

			let active = data.activated ?? false;
			let roles = data.roleIds;

			if (i.customId === "autoroleSelect") {
				if (!i.isRoleSelectMenu()) {
					return;
				}

				roles = i.values;

				logger.logInteraction(
					oneLine`
						Roles changed from
						[${data.roleIds.join(", ")}]
						to [${roles.join(", ")}]
					`
				);
			} else if (i.customId === "autoroleClear") {
				roles = [];

				logger.logInteraction(
					oneLine`
						Roles changed from
						[${data.roleIds.join(", ")}]
						to [${roles.join(", ")}]
					`
				);
			} else if (i.customId === "autoroleEnable") {
				active = true;

				logger.logInteraction("Activated autorole");
			} else if (i.customId === "autoroleDisable") {
				active = false;
				logger.logInteraction("Deactivated autorole");
			}

			await autoroleManager.update({
				discordTimestamp: Date.now().toString(),
				moderatorTag: i.user.tag,
				moderatorId: i.user.id,

				activated: active,
				roleIds: roles
			});

			collector.stop("stop");
		});

		collector.on("end", async (_, reason) => {
			if (reason === "time") {
				await interaction.editReply({
					components: []
				});

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
