import { Colors, RegExp } from "#constants";
import {
	EmbedBuilder,
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

const attachmentsToURL = (...attachments: Array<Attachment>) => {
	const { image, video, audio, other } = attachments.reduce(
		(obj, attachment) => {
			if (attachment.contentType?.startsWith("image")) {
				obj.image.push(
					`[Image ${obj.image.length + 1}](<${attachment.url}>)`
				);
			} else if (attachment.contentType?.startsWith("video")) {
				obj.video.push(
					`[Video ${obj.video.length + 1}](<${attachment.url}>)`
				);
			} else if (attachment.contentType?.startsWith("audio")) {
				obj.audio.push(
					`[Audio ${obj.audio.length + 1}](<${attachment.url}>)`
				);
			} else {
				obj.other.push(
					`[Attachment ${obj.other.length + 1}](<${attachment.url}>)`
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

		if (1 < message.attachments.size) {
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
		content.push("*No content.*");
	}

	embed.setDescription(content.join("\n\n") || null);

	return embed;
};
