import { Regex } from "#constants";

export const destructureMessageURL = (
	url: string
): { channelId: string; guildId: string; messageId: string } | null => {
	const match = url.match(Regex.MessageURL)?.groups;

	if (!match?.guildId || !match.channelId || !match.channelId) {
		return null;
	}

	return match as { channelId: string; guildId: string; messageId: string };
};
