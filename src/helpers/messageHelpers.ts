import { Colors, RegExp } from "#constants";
import { EmbedBuilder, type Client, type Message } from "discord.js";

export function parseMessageURL(url: string) {
	const match = url.match(RegExp.MessageURL)?.groups;

	if (!match) {
		return null;
	}

	return match as { guildId: string; channelId: string; messageId: string };
}

export async function messageFromURL(
	client: Client<true>,
	data: string | { guildId: string; channelId: string; messageId: string },
	options?: { rejectProtectedChannels?: boolean }
) {
	const obj = typeof data === "string" ? parseMessageURL(data) : data;

	if (!obj) {
		return false;
	}

	const guild = client.guilds.cache.get(obj.guildId);

	if (!guild) {
		return null;
	}

	if (options?.rejectProtectedChannels) {
		//
	}

	const channel = guild.channels.cache.get(obj.channelId);

	if (!channel?.isTextBased()) {
		return null;
	}

	return channel.messages.fetch(obj.messageId).catch(() => null);
}

export const messageToEmbed = (message: Message<true>) => {
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
};
