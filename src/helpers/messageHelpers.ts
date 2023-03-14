import { Colors, RegExp } from "#constants";
import {
	EmbedBuilder,
	hideLinkEmbed,
	hyperlink,
	italic,
	type Attachment,
	type Client,
	type Message
} from "discord.js";

export function parseMessageURL(url: string) {
	const match = url.match(RegExp.MessageURL)?.groups;

	if (!match) {
		return null;
	}

	return match as { guildId: string; channelId: string; messageId: string };
}

export async function messageFromURL(
	client: Client<true>,
	data: string | { guildId: string; channelId: string; messageId: string }
) {
	const data_ = typeof data === "string" ? parseMessageURL(data) : data;

	if (!data_) {
		return false;
	}

	const { guildId, channelId, messageId } = data_;

	const guild = client.guilds.cache.get(guildId);

	if (!guild) {
		return null;
	}

	const channel = guild.channels.cache.get(channelId);

	if (!channel?.isTextBased()) {
		return null;
	}

	return channel.messages
		.fetch({ message: messageId, force: true })
		.catch(() => null);
}

const attachmentsToURL = (...attachments: Array<Attachment>) => {
	const { image, video, audio, other } = attachments.reduce(
		(obj, attachment) => {
			if (attachment.contentType?.startsWith("image")) {
				obj.image.push(
					hyperlink(
						`Image ${obj.image.length + 1}`,
						hideLinkEmbed(attachment.url)
					)
				);
			} else if (attachment.contentType?.startsWith("video")) {
				obj.video.push(
					hyperlink(
						`Video ${obj.video.length + 1}`,
						hideLinkEmbed(attachment.url)
					)
				);
			} else if (attachment.contentType?.startsWith("audio")) {
				obj.audio.push(
					hyperlink(
						`Audio ${obj.audio.length + 1}`,
						hideLinkEmbed(attachment.url)
					)
				);
			} else {
				obj.other.push(
					hyperlink(
						`Attachment ${obj.other.length + 1}`,
						hideLinkEmbed(attachment.url)
					)
				);
			}

			return obj;
		},
		{
			image: [] as Array<string>,
			video: [] as Array<string>,
			audio: [] as Array<string>,
			other: [] as Array<string>
		}
	);

	return [...image, ...video, ...audio, ...other].join(" • ");
};

const isValidAttachment = (attachment: Attachment) =>
	["image/jpeg", "image/png", "image/gif"].includes(
		attachment.contentType ?? ""
	) &&
	[".jpg", ".png", ".gif"].some((e) =>
		(attachment.name ?? "").toLowerCase().endsWith(e)
	);

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
		const attachment = message.attachments.find((a) =>
			isValidAttachment(a)
		);

		if (message.attachments.size > 1) {
			content.push(
				attachmentsToURL(...[...message.attachments.values()])
			);
		} else if (!attachment) {
			const firstAttachment = message.attachments.first();

			// should always be there
			if (firstAttachment) {
				content.push(attachmentsToURL(firstAttachment));
			}
		}

		if (attachment) {
			embed.setImage(attachment.url);
		}
	}

	if (message.content) {
		content.push(message.content);
	} else if (!message.embeds.length && !message.attachments.size) {
		content.push(italic("No content."));
	}

	embed.setDescription(content.join("\n\n") || null);

	return embed;
};
