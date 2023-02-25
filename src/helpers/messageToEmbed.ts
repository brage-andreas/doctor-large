import { COLORS } from "#constants";
import { EmbedBuilder, type Message } from "discord.js";

export default function messageToEmbed(message: Message<true>) {
	const embed = new EmbedBuilder()
		.setAuthor({
			iconURL: message.author.displayAvatarURL(),
			name: `${message.author.tag} (${message.author.id})`
		})
		.setColor(COLORS.EMBED_INVISIBLE)
		.setDescription(message.content.length ? message.content : null)
		.setFooter({ text: `#${message.channel.name}` })
		.setTimestamp(message.createdAt);

	if (message.attachments.size) {
		const attachment = message.attachments.first();
		const type = attachment?.contentType ?? "";
		const name = attachment?.name ?? "";

		const validType = ["image/jpeg", "image/png", "image/gif"].includes(
			type
		);

		const validName = [".jpg", ".png", ".gif"].some((e) =>
			name.toLowerCase().endsWith(e)
		);

		if (attachment && validType && validName) {
			embed.setImage(attachment.url);
		}
	}

	return embed;
}
