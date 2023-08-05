import components from "#components";
import { Colors, Emojis } from "#constants";
import { getMissingPermissions, listify } from "#helpers";
import ConfigModule from "#modules/Config.js";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type ButtonInteraction,
	type ChannelSelectMenuInteraction,
	type ChannelType
} from "discord.js";
import { clearTimeout, setTimeout } from "node:timers";

async function roles(
	interaction:
		| ButtonInteraction<"cached">
		| ChannelSelectMenuInteraction<"cached">,
	config: ConfigModule,
	options: {
		type: "restrictRoles";
	}
): Promise<{
	roleIds: Array<string>;
}> {
	const roleIds = config[`${options.type}Ids`];
	const rolesStringArray = [...roleIds].map((id) => {
		const role = interaction.guild.roles.cache.get(id);

		return role
			? `1. ${role} \`${role.id}\``
			: `1. ${Emojis.Error} Role \`${id}\` not found`;
	});

	const nameString = options.type.split(/(?=[A-Z])/).join(" ");
	const name = nameString.charAt(0).toUpperCase() + nameString.slice(1);

	const me = await interaction.guild.members.fetchMe().catch(() => null);
	const hasManagesRoles = me?.permissions.has(
		PermissionFlagsBits.ManageRoles
	);

	let missingPermissionsStr = "";

	if (hasManagesRoles === undefined) {
		missingPermissionsStr += `${Emojis.Warn} Unable to check for \`Manage Roles\` permission`;
	} else if (!hasManagesRoles) {
		missingPermissionsStr += `${Emojis.Error} Missing \`Manage Roles\` permission`;
	}

	const embed = new EmbedBuilder()
		.setTitle(name)
		.setColor(roleIds.size ? Colors.Green : Colors.Yellow);

	if (rolesStringArray.length) {
		embed.setDescription(
			`Roles:\n${rolesStringArray.join("\n")}\n\n${missingPermissionsStr}`
		);
	} else {
		embed.setDescription(`Roles: None\n\n${missingPermissionsStr}`);
	}

	const rows = components.createRows(
		components.selectMenus.role,
		components.set.disabled(components.buttons.clear, !roleIds.size),
		components.buttons.back
	);

	const msg = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed]
	});

	return new Promise((resolve, reject) => {
		const collector = msg.createMessageComponentCollector({
			filter: (componentInteraction) =>
				componentInteraction.user.id === interaction.user.id,
			time: 120_000,
			max: 1
		});

		// safeguard
		const timeoutId = setTimeout(() => reject(), 125_000);

		collector.on("ignore", (componentInteraction) => {
			componentInteraction.reply({
				content: `${Emojis.NoEntry} This button is not for you.`,
				ephemeral: true
			});
		});

		collector.on("collect", async (interaction) => {
			await interaction.deferUpdate();

			clearTimeout(timeoutId);

			switch (interaction.customId) {
				case components.buttons.back.customId: {
					reject();

					break;
				}

				case components.selectMenus.role.customId: {
					if (!interaction.isRoleSelectMenu()) {
						throw new TypeError(
							"Role select menu component is not of type RoleSelectMenu"
						);
					}

					resolve({ roleIds: interaction.values });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new TypeError(
							"Button component is not of type Button"
						);
					}

					resolve({ roleIds: [] });

					break;
				}
			}
		});

		collector.on("end", (_, reason) => {
			if (reason === "time") {
				clearTimeout(timeoutId);

				reject();
			}
		});
	});
}

async function channels(
	interaction:
		| ButtonInteraction<"cached">
		| ChannelSelectMenuInteraction<"cached">,
	config: ConfigModule,
	options: {
		channelTypes: Array<ChannelType>;
		checkPermissions?: boolean;
		id: "pinArchiveChannelId" | "protectedChannelsIds";
		max: number;
		min: number;
		name: string;
	}
): Promise<{
	channelIds: Array<string>;
}> {
	const channelIdsOrId = config[options.id];
	const channelIdsArray =
		typeof channelIdsOrId === "string"
			? [channelIdsOrId]
			: channelIdsOrId?.size
			? [...channelIdsOrId]
			: null;

	const isEmpty = !channelIdsArray?.length;

	const channelStringArray = channelIdsArray?.length
		? channelIdsArray.map((id) => {
				const channel = interaction.guild.channels.cache.get(id);
				const type = ConfigModule.getTypeFromChannel(channel);

				if (!channel) {
					return `1. ${Emojis.Warn} Channel \`${id}\` not found`;
				}

				if (!options.checkPermissions || !channel.isTextBased()) {
					return `1. ${channel} \`${channel.id}\` (${type})`;
				}

				const missingPermissions = getMissingPermissions(
					channel,
					"ViewChannel",
					"SendMessages",
					"EmbedLinks"
				);

				let string = `1. ${channel} \`${channel.id}\` (${type})`;

				if (missingPermissions.length) {
					const list = listify(missingPermissions, { length: 3 });

					string += `\n * ${Emojis.Error} Missing permissions: ${list}`;
				}

				return string;
		  })
		: false;

	const embed = new EmbedBuilder()
		.setColor(isEmpty ? Colors.Yellow : Colors.Green)
		.setTitle(options.name);

	if (channelStringArray) {
		embed.setDescription(`Channels:\n${channelStringArray.join("\n")}`);
	} else {
		embed.setDescription("Channels: None");
	}

	const rows = components.createRows(
		components.selectMenus.channel.component(options),
		components.set.disabled(components.buttons.clear, isEmpty),
		components.buttons.back
	);

	const msg = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed]
	});

	return new Promise((resolve, reject) => {
		const collector = msg.createMessageComponentCollector({
			filter: (componentInteraction) =>
				componentInteraction.user.id === interaction.user.id,
			time: 120_000,
			max: 1
		});

		// safeguard
		const timeoutId = setTimeout(() => reject(), 125_000);

		collector.on("ignore", (componentInteraction) => {
			componentInteraction.reply({
				content: `${Emojis.NoEntry} This button is not for you.`,
				ephemeral: true
			});
		});

		collector.on("collect", async (interaction) => {
			await interaction.deferUpdate();

			clearTimeout(timeoutId);

			switch (interaction.customId) {
				case components.buttons.back.customId: {
					reject();

					break;
				}

				case components.selectMenus.channel.customId: {
					if (!interaction.isChannelSelectMenu()) {
						throw new TypeError(
							"Channel select menu component is not of type ChannelSelectMenu"
						);
					}

					resolve({ channelIds: interaction.values });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new TypeError(
							"Button component is not of type Button"
						);
					}

					resolve({ channelIds: [] });

					break;
				}
			}
		});

		collector.on("end", (_, reason) => {
			if (reason === "time") {
				clearTimeout(timeoutId);

				reject();
			}
		});
	});
}

const handleConfigOption = { channels, roles };
export default handleConfigOption;
