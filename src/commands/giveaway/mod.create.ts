import { type ChatInputCommandInteraction } from "discord.js";
import GiveawayManager from "../../database/giveaway.js";

export default async function (
	interaction: ChatInputCommandInteraction<"cached">
) {
	const giveawayManager = new GiveawayManager(interaction.guildId);

	const giveawayTitle = interaction.options.getString("title", true);
	const giveawayDescription = interaction.options.getString("description");
	const numberOfWinners =
		interaction.options.getInteger("number-of-winners") ?? 1;

	giveawayManager.create({
		givawayRelativeId,
		giveawayTitle,
		giveawayDescription,
		active: false,
		numberOfWinners,
		prizes: undefined,
		guildId: interaction.guildId,
		channelId: null,
		messageId: null,
		hostUserId: interaction.user.id,
		hostUserTag: interaction.user.tag,
		userEntriesIds: [],
		lockEntries: false,
		createdTimestamp: interaction.createdTimestamp,
		endTimestamp: 0,
		winnerUserIds: []
	});
}
