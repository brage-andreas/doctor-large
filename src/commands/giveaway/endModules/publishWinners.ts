import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type GuildTextBasedChannel,
	type Message
} from "discord.js";
import GiveawayManager from "../../../database/giveaway.js";
import { listify } from "../../../helpers/listify.js";
import Logger from "../../../logger/logger.js";
import { type CompleteGiveaway } from "../../../typings/database.js";

const getWinnersEmbed = (giveaway: CompleteGiveaway) => {
	const winners = giveaway.prizes
		.map((prize) => prize.winner?.userId)
		.filter((e) => Boolean(e));

	const data = giveaway.prizes
		.map(
			(prize) =>
				prize.winner?.userId &&
				`→ <@${prize.winner.userId}> won **1x ${prize.name}**`
		)
		.filter((e) => Boolean(e))
		.join("\n");

	const embed = new EmbedBuilder()
		.setColor("#2d7d46")
		.setTitle(`🎉 Giveaway #${giveaway.guildRelativeId} has ended!`)
		.setFooter({
			text: `Giveaway #${giveaway.guildRelativeId} • Hosted by ${giveaway.hostUserTag}`
		});

	embed.setDescription(stripIndents`
		The winners are: ${
			winners.length
				? listify(
						[...new Set(winners)].map((id) => `<@${id}>`),
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

	if (giveaway.winnerMessageId) {
		await channel.messages
			.delete(giveaway.winnerMessageId)
			.catch(() => null);
	}

	const winnerIds = [
		...new Set(
			giveaway.prizes
				.map((prize) => prize.winner?.userId)
				.filter((e) => Boolean(e)) as Array<string>
		)
	];

	let message: Message<true>;

	const acceptPrizeButton = new ButtonBuilder()
		.setCustomId(`accept-prize-${giveawayId}`)
		.setLabel("Accept prize")
		.setEmoji("🤩")
		.setStyle(ButtonStyle.Success);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		acceptPrizeButton
	);

	if (giveawayMessage) {
		message = await giveawayMessage.reply({
			allowedMentions: { users: winnerIds },
			failIfNotExists: false,
			content: winnerIds.map((id) => `<@${id}>`).join(" "),
			embeds: [getWinnersEmbed(giveaway)],
			components: [row]
		});
	} else {
		message = await channel.send({
			allowedMentions: { users: winnerIds },
			content: winnerIds.map((id) => `<@${id}>`).join(" "),
			embeds: [getWinnersEmbed(giveaway)],
			components: [row]
		});
	}

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Winners of giveaway #${giveawayId} published in #${channel.name} (${channel.id})`
	);

	await giveawayManager.edit({
		where: {
			giveawayId
		},
		data: {
			winnerMessageId: message.id
		}
	});
}
