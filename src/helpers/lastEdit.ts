import { type User } from "discord.js";

export default function lastEditBy(user: User) {
	return {
		lastEditedTimestamp: Date.now().toString(),
		lastEditedUserTag: user.tag,
		lastEditedUserId: user.id
	};
}
