import { type APIEmbed, type Attachment, type Message } from "discord.js";
import { ColorsHex } from "#constants";

const isValidAttachmentForEmbedImage = (attachment: Attachment) =>
	["image/gif", "image/jpeg", "image/png"].includes(attachment.contentType ?? "");

const attachmentsToURL = (...attachments: Array<Attachment>) => {
	const { audio, image, other, video } = attachments.reduce(
		(object, attachment) => {
			if (attachment.contentType?.startsWith("image")) {
				object.image.push(`[image ${object.image.length + 1}](<${attachment.url}>)`);
			} else if (attachment.contentType?.startsWith("video")) {
				object.video.push(`[video ${object.video.length + 1}](<${attachment.url}>)`);
			} else if (attachment.contentType?.startsWith("audio")) {
				object.audio.push(`[audio ${object.audio.length + 1}](<${attachment.url}>)`);
			} else {
				object.other.push(`[other ${object.other.length + 1}](<${attachment.url}>)`);
			}

			return object;
		},
		{
			audio: [] as Array<string>,
			image: [] as Array<string>,
			other: [] as Array<string>,
			video: [] as Array<string>,
		}
	);

	const attachmentsString = [...image, ...video, ...audio, ...other].join(" • ");

	return attachmentsString.charAt(0).toUpperCase() + attachmentsString.slice(1);
};

export const messageToEmbed = (message: Message<true>, options?: { withIds?: boolean }) => {
	const footerText = options?.withIds
		? `ID: ${message.id} • From #${message.channel.name} (${message.channelId})`
		: `From #${message.channel.name}`;

	const embed: APIEmbed = {
		author: {
			icon_url: message.author.displayAvatarURL(),
			name: `${message.author.tag} (${message.author.id})`,
			url: message.url,
		},
		color: ColorsHex.EmbedInvisible,
		footer: { text: footerText },
		timestamp: message.createdAt.toISOString(),
	};

	if (message.embeds.length > 0) {
		const emb = message.embeds.find((embed) => embed.image ?? embed.thumbnail);

		const url = emb?.image?.url ?? emb?.thumbnail?.url;

		if (url) {
			embed.image = { url };
		}
	}

	const description: Array<string> = [];

	if (message.attachments.size > 0) {
		description.push(attachmentsToURL(...message.attachments.values()));

		const firstImageAttachment = message.attachments.find((attachment) =>
			isValidAttachmentForEmbedImage(attachment)
		);

		if (firstImageAttachment) {
			embed.image = { url: firstImageAttachment.url };
		}
	}

	if (message.content) {
		description.push(message.content);
	} else if (message.embeds.length === 0 && message.attachments.size === 0) {
		description.push("[No content]");
	}

	embed.description = description.join("\n\n") || undefined;

	return embed;
};
