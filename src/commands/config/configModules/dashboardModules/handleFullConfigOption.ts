import components from "#components";
import { Colors, Emojis } from "#constants";
import type ConfigModule from "#modules/Config.js";
import { stripIndent } from "common-tags";
import {
	EmbedBuilder,
	type ButtonInteraction,
	type ChannelSelectMenuInteraction,
	type ChannelType,
	type ForumChannel,
	type GuildTextBasedChannel
} from "discord.js";
import { clearTimeout, setTimeout } from "node:timers";

const createEmbed = (
	channel: ForumChannel | GuildTextBasedChannel | undefined,
	channelId: string | null,
	enabled: boolean,
	name: string,
	comment?: string
) =>
	new EmbedBuilder()
		.setTitle(name)
		.setColor(enabled ? Colors.Green : Colors.Red)
		.setDescription(stripIndent`
			Channel: ${
				channel
					? `${channel} - #${channel.name} (${channel.id})`
					: channelId
					? `${Emojis.Warn} Channel \`${channelId}\` not found`
					: `Not set${comment ? `. ${comment}` : ""}`
			}
			Enabled: ${enabled ? `${Emojis.On} Yes` : `${Emojis.Off} No`}
		`);

export default async function handleFullConfigOption(
	interaction:
		| ButtonInteraction<"cached">
		| ChannelSelectMenuInteraction<"cached">,
	config: ConfigModule,
	options: {
		type: "caseLog" | "memberLog" | "messageLog" | "report";
		channelTypes: Array<ChannelType>;
	}
): Promise<{
	channelId?: string | null;
	enabled?: boolean;
}> {
	const channel = config[`${options.type}Channel`];
	const channelId = config[`${options.type}ChannelId`];
	const enabled = config[`${options.type}Enabled`];

	const nameString = options.type.split(/(?=[A-Z])/).join(" ");
	const name = nameString.charAt(0).toUpperCase() + nameString.slice(1);

	const embed = createEmbed(
		channel,
		channelId,
		enabled,
		name,
		options.type === "report" ? "Thread channel is recommended." : undefined
	);

	const rows = components.createRows(
		components.selects.channelSelect.component({
			channelTypes: options.channelTypes
		}),
		enabled ? components.buttons.disable : components.buttons.enable,
		components.buttons.clear.component().setDisabled(!channelId),
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

					resolve({ channelId: interaction.values[0] });

					break;
				}

				case components.buttons.enable.customId: {
					if (!interaction.isButton()) {
						throw new Error(
							"Button component is not of type Button"
						);
					}

					resolve({ enabled: true });

					break;
				}

				case components.buttons.disable.customId: {
					if (!interaction.isButton()) {
						throw new Error(
							"Button component is not of type Button"
						);
					}

					resolve({ enabled: false });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new Error(
							"Button component is not of type Button"
						);
					}

					resolve({ channelId: null });

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
