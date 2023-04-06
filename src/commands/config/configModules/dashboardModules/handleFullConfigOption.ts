import components from "#components";
import { Colors, Emojis } from "#constants";
import type ConfigModule from "#modules/Config.js";
import { stripIndent } from "common-tags";
import {
	EmbedBuilder,
	inlineCode,
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
					? `${Emojis.Warn} Channel ${inlineCode(
							channelId
					  )} not found`
					: `Not set${comment ? `. ${comment}` : ""}`
			}
			Enabled: ${enabled ? `${Emojis.On} Yes` : `${Emojis.Off} No`}
		`);

export default async function handleFullConfigOption(
	interaction:
		| ButtonInteraction<"cached">
		| ChannelSelectMenuInteraction<"cached">,
	config: ConfigModule,
	type: "caseLog" | "memberLog" | "messageLog" | "report",
	channelTypes: Array<ChannelType>
): Promise<{
	channelId?: string | null;
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
		type === "report" ? "Thread channel is recommended." : undefined
	);

	const rows = components.createRows(
		components.selectMenus.channel.component({
			channelTypes
		}),
		enabled ? components.buttons.disable : components.buttons.enable,
		components.set.disabled(components.buttons.clear, !channelId),
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

					const enabled = currentlyEmpty ? true : undefined;
					resolve({ channelId: interaction.values[0], enabled });

					break;
				}

				case components.buttons.enable.customId: {
					if (!interaction.isButton()) {
						throw new TypeError(
							"Button component is not of type Button"
						);
					}

					resolve({ enabled: true });

					break;
				}

				case components.buttons.disable.customId: {
					if (!interaction.isButton()) {
						throw new TypeError(
							"Button component is not of type Button"
						);
					}

					resolve({ enabled: false });

					break;
				}

				case components.buttons.clear.customId: {
					if (!interaction.isButton()) {
						throw new TypeError(
							"Button component is not of type Button"
						);
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
