import { ColorsHex, RegExp } from "#constants";
import {
	hideLinkEmbed,
	hyperlink,
	italic,
	type APIEmbed,
	type Attachment,
	type Client,
	type Message
} from "discord.js";

export function messageURL<
	G extends string,
	C extends string,
	M extends string
>(guildId: G, channelId: C, messageId: M) {
	return `https://discord.com/channels/${guildId}/${channelId}/${messageId}` as const;
}

export function parseMessageURL(
	url: string
): { guildId: string; channelId: string; messageId: string } | null {
	const match = url.match(RegExp.MessageURL)?.groups;

	if (!match?.guildId || !match.channelId || !match.channelId) {
		return null;
	}

	return match as { guildId: string; channelId: string; messageId: string };
}

export async function messageFromURL(
	client: Client<true>,
	dataOrURL:
		| string
		| { guildId: string; channelId: string; messageId: string }
): Promise<Message<true> | null> {
	const data =
		typeof dataOrURL === "string" ? parseMessageURL(dataOrURL) : dataOrURL;

	if (!data) {
		return null;
	}

	const { guildId, channelId, messageId } = data;

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
		attachment.name.toLowerCase().endsWith(e)
	);

export const messageToEmbed = (
	message: Message<true>,
	options?: { withIds?: boolean }
) => {
	const footerText = options?.withIds
		? `${message.id} • #${message.channel.name} (${message.channelId})`
		: `#${message.channel.name}`;

	const embed: APIEmbed = {
		author: {
			icon_url: message.author.displayAvatarURL(),
			name: `${message.author.tag} (${message.author.id})`,
			url: message.url
		},
		color: ColorsHex.EmbedInvisible,
		footer: { text: footerText },
		timestamp: message.createdAt.toISOString()
	};

	if (message.embeds.length) {
		const emb = message.embeds.find(
			(embed) => embed.image || embed.thumbnail
		);

		const url = emb?.image?.url ?? emb?.thumbnail?.url;

		if (url) {
			embed.image = { url };
		}
	}

	const content: Array<string> = [];

	if (message.attachments.size) {
		const attachment = message.attachments.find((attachment) =>
			isValidAttachment(attachment)
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
			embed.image = { url: attachment.url };
		}
	}

	if (message.content) {
		content.push(message.content);
	} else if (!message.embeds.length && !message.attachments.size) {
		content.push(italic("No content."));
	}

	embed.description = content.join("\n\n") || undefined;

	return embed;
};
