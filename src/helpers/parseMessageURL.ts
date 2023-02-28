import { REGEXP } from "#constants";
import { type Client } from "discord.js";

export function parseMessageURL(url: string) {
	const match = url.match(REGEXP.MESSAGE_URL)?.groups;

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
