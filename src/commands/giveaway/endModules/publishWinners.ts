import { type giveaway, type giveawayPrize } from "@prisma/client";
import { stripIndents } from "common-tags";
import { EmbedBuilder, type GuildTextBasedChannel } from "discord.js";
import GiveawayManager from "../../../database/giveaway.js";
import { listify } from "../../../helpers/listify.js";

const getWinnersEmbed = (
	giveaway: giveaway & {
		prizes: Array<giveawayPrize>;
	}
) => {
	const winners = giveaway.winnerUserIds;

	const data = giveaway.prizes
		.map((prize) => `→ <@${prize.winnerId}> won **1x ${prize.name}**`)
		.join("\n");

	const embed = new EmbedBuilder().setFooter({
		text: `Winners of giveaway #${giveaway.guildRelativeId}`
	});

	embed.setDescription(stripIndents`
		🎉 Giveaway #${giveaway.guildRelativeId} has ended!

		The winners are: ${
			winners.length
				? listify(
						winners.map((id) => `<@${id}>`),
						{ length: winners.length }
				  )
				: "No winners"
		}

		${data}

		Congratulations! 🎊
	`);

	return embed;
};

export default async function publishWinners(
	channel: GuildTextBasedChannel,
	giveawayId: number
) {
	const giveawayManager = new GiveawayManager(channel.guild.id);

	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return null;
	}

	const giveawayMessage =
		channel.id === giveaway.channelId && giveaway.messageId
			? await channel.messages.fetch(giveaway.messageId)
			: null;

	if (giveawayMessage) {
		giveawayMessage.reply({
			embeds: [getWinnersEmbed(giveaway)],
			failIfNotExists: false
		});
	} else {
		channel.send({ embeds: [getWinnersEmbed(giveaway)] });
	}
}
