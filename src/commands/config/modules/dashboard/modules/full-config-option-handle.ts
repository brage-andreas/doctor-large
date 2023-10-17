import {
	type ButtonInteraction,
	type ChannelSelectMenuInteraction,
	type ChannelType,
	EmbedBuilder,
	type ForumChannel,
	type GuildTextBasedChannel,
} from "discord.js";
import { clearTimeout, setTimeout } from "node:timers";
import type ConfigModule from "#modules/config.js";
import { getMissingPermissions } from "#helpers";
import components from "#discord-components";
import { Colors, Emojis } from "#constants";
import { stripIndents } from "common-tags";

const createEmbed = (
	channel: ForumChannel | GuildTextBasedChannel | undefined,
	channelId: null | string,
	enabled: boolean,
	name: string,
	comment?: string
) => {
	const embed = new EmbedBuilder().setTitle(name).setColor(enabled ? Colors.Green : Colors.Red);

	if (!channel) {
		embed.setDescription(stripIndents`
			Enabled: ${enabled ? `${Emojis.On} Yes` : `${Emojis.Off} No`}
			Channel: ${channelId ? `${Emojis.Warn} Channel \`${channelId}\` not found` : "Not set"}
			${comment ?? ""}
		`);

		return embed;
	}

	let missingPermissions = getMissingPermissions(channel, "ViewChannel", "SendMessages", "EmbedLinks").map(
		(permission) => `* ${permission}`
	);

	if (missingPermissions.length > 0) {
		missingPermissions = [`${Emojis.Error} Missing permissions:`, ...missingPermissions];
	}

	embed.setDescription(stripIndents`
		Enabled: ${enabled ? `${Emojis.On} Yes` : `${Emojis.Off} No`}
		Channel: ${channel} \`${channel.id}\`${comment ? `\n${comment}` : ""}

		${missingPermissions.join("\n")}
	`);

	return embed;
};

export default async function handleFullConfigOption(
	interaction: ButtonInteraction<"cached"> | ChannelSelectMenuInteraction<"cached">,
	config: ConfigModule,
	type: "caseLog" | "memberLog" | "messageLog" | "report",
	channelTypes: Array<ChannelType>
): Promise<{
	channelId?: null | string;
	enabled?: boolean;
}> {
	const channel = config[`${type}Channel`];
	const channelId = config[`${type}ChannelId`];
	const enabled = config[`${type}Enabled`];

	const currentlyEmpty = !channelId;

	const nameString = type.split(/(?=[A-Z])/).join(" ");
	const name = nameString.charAt(0).toUpperCase() + nameString.slice(1);

	const embed = createEmbed(
		channel,
		channelId,
		enabled,
		name,
		type === "report" && channel && !channel.isTextBased() ? "Forum channel is recommended." : undefined
	);

	const rows = components.createRows(
		components.selectMenus.channel.component({ channelTypes }),
		enabled ? components.buttons.disable : components.buttons.enable,
		components.set.disabled(components.buttons.clear, !channelId),
		components.buttons.back
	);

	const message = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed],
	});

	return new Promise((resolve, reject) => {
		const collector = message.createMessageComponentCollector({
			filter: (componentInteraction) => componentInteraction.user.id === interaction.user.id,
			max: 1,
			time: 120_000,
		});

		// safeguard
		const timeoutId = setTimeout(() => {
			reject();
		}, 125_000);

		collector.on("ignore", (componentInteraction) => {
			componentInteraction
				.reply({
					content: `${Emojis.NoEntry} This button is not for you.`,
					ephemeral: true,
				})
				.catch(() => null);
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
						throw new TypeError("Channel select menu component is not of type ChannelSelectMenu");
					}

					const enabled = currentlyEmpty ? true : undefined;
					resolve({ channelId: interaction.values[0], enabled });

					break;
				}

				case components.buttons.enable.customId: {
					if (!interaction.isButton()) {
						throw new TypeError("Button component is not of type Button");
					}

					resolve({ enabled: true });

					break;
				}

				case components.buttons.disable.customId: {
					if (!interaction.isButton()) {
						throw new TypeError("Button component is not of type Button");
					}

					resolve({ enabled: false });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new TypeError("Button component is not of type Button");
					}

					resolve({ channelId: null, enabled: false });

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
