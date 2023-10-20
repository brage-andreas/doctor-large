import { type ButtonInteraction } from "discord.js";
import components from "#discord-components";
import { Emojis, Regex } from "#constants";
import { messageToEmbed } from "#helpers";
import Logger from "#logger";

export default async function previewMessage(interaction: ButtonInteraction<"cached">) {
	await interaction.deferReply({ ephemeral: true });

	const match = interaction.customId.match(Regex.PreviewMessage);
	const channelId = match?.groups?.channelId;
	const messageId = match?.groups?.messageId;

	if (!channelId || !messageId) {
		await interaction.editReply({
			content: `${Emojis.Error} This button is faulty.`,
		});

		return;
	}

	const channel = await interaction.guild.channels.fetch(channelId);

	if (!channel?.isTextBased()) {
		await interaction.editReply({
			content: `${Emojis.Error} This button is faulty, as the channel no longer exist or is unavailable to me.\n(Channel \`${channelId}\`)`,
		});

		return;
	}

	const message = await channel.messages
		.fetch({
			force: true,
			message: messageId,
		})
		.catch(() => null);

	if (!message) {
		await interaction.editReply({
			content: `${Emojis.Error} This button is faulty, as the message no longer exist or is unavailable to me.\n(Message \`${messageId}\` in channel \`${channelId}\`)`,
		});

		return;
	}

	const embed = messageToEmbed(message);
	const row = components.createRows(components.buttons.url({ label: "Go to message", url: message.url }));

	new Logger({
		color: "grey",
		interaction,
		label: "BUTTON",
	}).log(`Sent preview of message ${messageId} of channel ${channelId}`);

	await interaction.editReply({
		components: row,
		content: null,
		embeds: [embed],
	});
}
