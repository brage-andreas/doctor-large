import { type Client, type Message } from "discord.js";
import { destructureMessageURL } from "#helpers";

export const getMessageFromURL = async (
	client: Client<true>,
	dataOrURL: { channelId: string; guildId: string; messageId: string } | string
): Promise<Message<true> | null> => {
	const data = typeof dataOrURL === "string" ? destructureMessageURL(dataOrURL) : dataOrURL;

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
};
