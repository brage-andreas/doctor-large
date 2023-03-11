import components from "#components";
import { Colors, Emojis } from "#constants";
import ConfigModule from "#modules/Config.js";
import { source } from "common-tags";
import {
	EmbedBuilder,
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
			? `→ \`${role.id}\` ${role} (\`@${role.name}\`)`
			: `→ ${Emojis.Error} Role \`${id}\` not found.`;
	});

	const nameString = options.type.split(/(?=[A-Z])/).join(" ");
	const name = nameString.charAt(0).toUpperCase() + nameString.slice(1);

	const embed = new EmbedBuilder()
		.setTitle(name)
		.setColor(roleIds.size ? Colors.Green : Colors.Yellow)
		.setDescription(source`
			Roles:
			  ${rolesStringArray}
		`);

	const rows = components.createRows(
		components.selects.roleSelect.component(),
		components.buttons.clear.component().setDisabled(!roleIds.size),
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

				case components.selects.roleSelect.customId: {
					if (!interaction.isRoleSelectMenu()) {
						throw new Error(
							"Role select menu component is not of type RoleSelectMenu"
						);
					}

					resolve({ roleIds: interaction.values });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new Error(
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
		name: string;
		id: "pinArchiveChannelId" | "protectedChannelsIds";
		channelTypes: Array<ChannelType>;
		min: number;
		max: number;
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

	const channelStringArray =
		channelIdsArray?.length &&
		channelIdsArray.map((id) => {
			const channel = interaction.guild.channels.cache.get(id);
			const type = ConfigModule.getTypeFromChannel(channel);

			return channel
				? `→ \`${channel.id}\` ${channel} (${type})`
				: `→ ${Emojis.Warn} Unknown channel \`${id}\``;
		});

	const embed = new EmbedBuilder()
		.setColor(isEmpty ? Colors.Yellow : Colors.Green)
		.setTitle(options.name);

	const channelOrChannels =
		typeof channelIdsOrId === "string"
			? "Channel"
			: channelIdsOrId?.size
			? `Channels (${channelIdsOrId.size})`
			: "Channels";

	if (!channelIdsArray) {
		embed.setDescription(`${channelOrChannels}: None`);
	} else {
		embed.setDescription(source`
			${channelOrChannels}
			  ${channelStringArray}
		`);
	}

	const rows = components.createRows(
		components.selects.channelSelect.component(options),
		components.buttons.clear.component().setDisabled(isEmpty),
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

				case components.selects.channelSelect.customId: {
					if (!interaction.isChannelSelectMenu()) {
						throw new Error(
							"Channel select menu component is not of type ChannelSelectMenu"
						);
					}

					resolve({ channelIds: interaction.values });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new Error(
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
