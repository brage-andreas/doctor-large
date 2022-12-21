import { oneLine, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	PermissionFlagsBits,
	type Message,
	type RepliableInteraction
} from "discord.js";
import GiveawayManager from "../../../database/giveaway.js";
import lastEditBy from "../../../helpers/lastEdit.js";
import { listify } from "../../../helpers/listify.js";
import Logger from "../../../logger/logger.js";
import { type CompleteGiveaway } from "../../../typings/database.js";

const getWinnersEmbed = (giveaway: CompleteGiveaway) => {
	const winners = giveaway.prizes
		.map((prize) => prize.winner?.userId)
		.filter((e) => Boolean(e));

	if (!winners.length) {
		return null;
	}

	const data = giveaway.prizes
		.map(
			(prize) =>
				prize.winner?.userId &&
				`→ <@${prize.winner.userId}> won **${prize.amount}x ${prize.name}**`
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
		The winners are: ${listify(
			[...new Set(winners)].map((id) => `<@${id}>`),
			{ length: winners.length }
		)}

		${data}

		Congratulations! 🎊
	`);

	return embed;
};

export async function publishWinners(
	interaction: RepliableInteraction<"cached">,
	giveawayId: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild.id);

	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				⚠️ This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(
		giveaway?.channelId ?? ""
	);

	if (!channel?.isTextBased()) {
		await interaction.editReply({
			content: stripIndents`
				⚠️ The channel the giveaway was published in does not exist, or is not a valid channel.
				Try again or republish the giveaway in a new channel.
			`,
			components: [],
			embeds: []
		});

		return;
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

	const acceptPrizeButton = new ButtonBuilder()
		.setCustomId(`accept-prize-${giveawayId}`)
		.setLabel("Accept prize")
		.setEmoji("🤩")
		.setStyle(ButtonStyle.Success);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		acceptPrizeButton
	);

	const embed = getWinnersEmbed(giveaway);
	let message: Message<true> | null;

	if (!embed) {
		await interaction.editReply({
			content: stripIndents`
				⚠️ This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret".
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (giveawayMessage) {
		message = await giveawayMessage
			.reply({
				allowedMentions: { users: winnerIds },
				failIfNotExists: false,
				content: winnerIds.map((id) => `<@${id}>`).join(" "),
				embeds: [embed],
				components: [row]
			})
			.catch(() => null);
	} else {
		message = await channel
			.send({
				allowedMentions: { users: winnerIds },
				content: winnerIds.map((id) => `<@${id}>`).join(" "),
				embeds: [embed],
				components: [row]
			})
			.catch(() => null);
	}

	if (!message) {
		let content: string;
		const permsInChannel =
			interaction.guild.members.me?.permissionsIn(channel);

		if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
			content = stripIndents`
				⚠️ I am missing permissions to send messages in ${channel} (${channel.id}).
			`;
		} else {
			content = stripIndents`
				⚠️ I could not publish the winners in ${channel} (${channel.id}). Please try again.
			`;
		}

		return await interaction.editReply({
			components: [],
			content,
			embeds: []
		});
	}

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Published winners of giveaway #${giveawayId} in #${channel.name} (${channel.id})`
	);

	await giveawayManager.edit({
		where: {
			giveawayId
		},
		data: {
			winnerMessageId: message.id,
			...lastEditBy(interaction.user)
		}
	});

	await interaction.editReply({
		content: stripIndents`
			✨ Done! Published the winners of giveaway #${giveaway.guildRelativeId} in ${channel}!

			Fine, if you don't believe me, [here is a link to it](<${message.url}>).
		`,
		components: [],
		embeds: []
	});
}

export async function republishWinners(
	interaction: RepliableInteraction<"cached">,
	giveawayId: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild.id);

	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				⚠️ This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const channel = interaction.guild.channels.cache.get(
		giveaway?.channelId ?? ""
	);

	if (!channel?.isTextBased()) {
		await interaction.editReply({
			content: oneLine`
				⚠️ The channel the giveaway was published in does not exist, or is not a valid channel.
				Try again or republish the giveaway in a new channel.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const currentMessage =
		giveaway.winnerMessageId &&
		(await channel.messages
			.fetch(giveaway.winnerMessageId)
			.catch(() => null));

	if (!currentMessage) {
		await publishWinners(interaction, giveawayId);

		return;
	}

	const winnerIds = [
		...new Set(
			giveaway.prizes
				.map((prize) => prize.winner?.userId)
				.filter((e) => Boolean(e)) as Array<string>
		)
	];

	const embed = getWinnersEmbed(giveaway);

	if (!embed) {
		await interaction.editReply({
			content: stripIndents`
				⚠️ This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret".
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const acceptPrizeButton = new ButtonBuilder()
		.setCustomId(`accept-prize-${giveawayId}`)
		.setLabel("Accept prize")
		.setEmoji("🤩")
		.setStyle(ButtonStyle.Success);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		acceptPrizeButton
	);

	await currentMessage
		.edit({
			allowedMentions: { users: winnerIds },
			content: winnerIds.map((id) => `<@${id}>`).join(" "),
			embeds: [],
			components: [row]
		})
		.catch(() => null);

	await giveawayManager.edit({
		where: {
			giveawayId
		},
		data: {
			...lastEditBy(interaction.user)
		}
	});

	await interaction.editReply({
		content: stripIndents`
			✨ Done! Republished the winners of giveaway #${giveaway.guildRelativeId} in ${channel}!

			Oh, I almost forgot! [Here is a link to it](<${currentMessage.url}>).
		`,
		components: [],
		embeds: []
	});

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Republished winners of giveaway #${giveaway.giveawayId} in #${channel.name} (${channel.id})`
	);
}
