import { Colors } from "#constants";
import { EmbedBuilder, type Message } from "discord.js";

export default function messageToEmbed(message: Message<true>) {
	const embed = new EmbedBuilder()
		.setAuthor({
			iconURL: message.author.displayAvatarURL(),
			name: `${message.author.tag} (${message.author.id})`
		})
		.setColor(Colors.EmbedInvisible)
		.setFooter({ text: `#${message.channel.name}` })
		.setTimestamp(message.createdAt);

	const content: Array<string> = [];

	if (message.embeds.length) {
		const emb = message.embeds.find(
			(embed) => embed.image || embed.thumbnail
		);

		const url = emb?.image?.url ?? emb?.thumbnail?.url;

		if (url) {
			embed.setImage(url);
		}
	}

	if (message.attachments.size) {
		const attachment = message.attachments.first();
		const type = attachment?.contentType ?? "";
		const name = attachment?.name ?? "";

		content.push(
			[...message.attachments.values()]
				.map(({ url }, i) => `[Attachment ${i + 1}](<${url}>)`)
				.join(" • "),
			"---"
		);

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

	content.push(message.content || "*No content.*");

	embed.setDescription(content.join("\n\n"));

	return embed;
}
