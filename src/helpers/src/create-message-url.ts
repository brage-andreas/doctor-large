export const createMessageURL = <Guild extends string, Channel extends string, Message extends string>(
	guildId: Guild,
	channelId: Channel,
	messageId: Message
) => `https://discord.com/channels/${guildId}/${channelId}/${messageId}` as const;
