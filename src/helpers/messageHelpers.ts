import {
	type APIEmbed,
	type Attachment,
	type Client,
	type Message,
	hideLinkEmbed,
	hyperlink,
	italic,
} from "discord.js";
import { ColorsHex, Regex } from "#constants";

export function messageURL<G extends string, C extends string, M extends string>(
	guildId: G,
	channelId: C,
	messageId: M
) {
	return `https://discord.com/channels/${guildId}/${channelId}/${messageId}` as const;
}

export function parseMessageURL(url: string): { channelId: string; guildId: string; messageId: string } | null {
	const match = url.match(Regex.MessageURL)?.groups;

	if (!match?.guildId || !match.channelId || !match.channelId) {
		return null;
	}

	return match as { channelId: string; guildId: string; messageId: string };
}

export async function messageFromURL(
	client: Client<true>,
	dataOrURL: { channelId: string; guildId: string; messageId: string } | string
): Promise<Message<true> | null> {
	const data = typeof dataOrURL === "string" ? parseMessageURL(dataOrURL) : dataOrURL;

	if (!data) {
		return null;
	}

	const { channelId, guildId, messageId } = data;

	const guild = client.guilds.cache.get(guildId);

	if (!guild) {
		return null;
	}

	const channel = guild.channels.cache.get(channelId);

	if (!channel?.isTextBased()) {
		return null;
	}

	return channel.messages.fetch({ force: true, message: messageId }).catch(() => null);
}

const attachmentsToURL = (...attachments: Array<Attachment>) => {
	const { audio, image, other, video } = attachments.reduce(
		(object, attachment) => {
			if (attachment.contentType?.startsWith("image")) {
				object.image.push(hyperlink(`Image ${object.image.length + 1}`, hideLinkEmbed(attachment.url)));
			} else if (attachment.contentType?.startsWith("video")) {
				object.video.push(hyperlink(`Video ${object.video.length + 1}`, hideLinkEmbed(attachment.url)));
			} else if (attachment.contentType?.startsWith("audio")) {
				object.audio.push(hyperlink(`Audio ${object.audio.length + 1}`, hideLinkEmbed(attachment.url)));
			} else {
				object.other.push(hyperlink(`Attachment ${object.other.length + 1}`, hideLinkEmbed(attachment.url)));
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

	return [...image, ...video, ...audio, ...other].join(" • ");
};

const isValidAttachment = (attachment: Attachment) =>
	["image/gif", "image/jpeg", "image/png"].includes(attachment.contentType ?? "") &&
	[".jpg", ".png", ".gif"].some((extension) => attachment.name.toLowerCase().endsWith(extension));

export const messageToEmbed = (message: Message<true>, options?: { withIds?: boolean }) => {
	const footerText = options?.withIds
		? `${message.id} • #${message.channel.name} (${message.channelId})`
		: `#${message.channel.name}`;

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

	const content: Array<string> = [];

	if (message.attachments.size > 0) {
		const attachment = message.attachments.find((attachment) => isValidAttachment(attachment));

		if (message.attachments.size > 1) {
			content.push(attachmentsToURL(...message.attachments.values()));
		} else if (!attachment) {
			const firstAttachment = message.attachments.first();

			// should always be there
			if (firstAttachment) {
				content.push(attachmentsToURL(firstAttachment));
			}
		}

		if (attachment) {
			embed.image = { url: attachment.url };
		}
	}

	if (message.content) {
		content.push(message.content);
	} else if (message.embeds.length === 0 && message.attachments.size === 0) {
		content.push(italic("No content."));
	}

	embed.description = content.join("\n\n") || undefined;

	return embed;
};
