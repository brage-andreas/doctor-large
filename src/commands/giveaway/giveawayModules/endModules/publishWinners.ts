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
import { EMOJIS } from "../../../../constants.js";
import GiveawayManager from "../../../../database/giveaway.js";
import lastEditBy from "../../../../helpers/lastEdit.js";
import { listify } from "../../../../helpers/listify.js";
import Logger from "../../../../logger/logger.js";
import { type GiveawayDataWithIncludes } from "../../../../typings/database.js";
import { getAllWinners, giveawayToWonPrizesMap } from "./getWinners.js";

const getWinnersEmbed = (giveaway: GiveawayDataWithIncludes) => {
	const winnerWithPrizesMap = giveawayToWonPrizesMap(giveaway);

	const data = [...winnerWithPrizesMap.entries()]
		.map(([userId, wonPrizes]) =>
			wonPrizes.map(
				(wonPrize) =>
					`→ <@${userId}> won **${wonPrize.quantityWon}x ${wonPrize.name}**`
			)
		)
		.join("\n");

	const embed = new EmbedBuilder()
		.setColor("#2d7d46")
		.setTitle(
			`${EMOJIS.TADA} Giveaway #${giveaway.guildRelativeId} has ended!`
		)
		.setFooter({
			text: `Giveaway #${giveaway.guildRelativeId} • Hosted by ${giveaway.hostUserTag}`
		});

	embed.setDescription(stripIndents`
		The winners are: ${listify(
			[...winnerWithPrizesMap.keys()].map((userId) => `<@${userId}>`),
			{ length: winnerWithPrizesMap.size }
		)}

		${data}

		Congratulations!
	`);

	return embed;
};

export async function publishWinners(
	interaction: RepliableInteraction<"cached">,
	id: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild);

	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.WARN} This giveaway does not exist. Try creating one or double-check the ID.
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
				${EMOJIS.WARN} The channel the giveaway was published in does not exist, or is not a valid channel.
				Try again or republish the giveaway in a new channel.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const giveawayMessage =
		channel.id === giveaway.channelId && giveaway.publishedMessageId
			? await channel.messages.fetch(giveaway.publishedMessageId)
			: null;

	if (giveaway.winnerMessageId) {
		await channel.messages
			.delete(giveaway.winnerMessageId)
			.catch(() => null);
	}

	const winnerIds = getAllWinners(giveaway);

	const acceptPrizeButton = new ButtonBuilder()
		.setCustomId(`accept-prize-${id}`)
		.setLabel("Accept prize")
		.setEmoji(EMOJIS.STAR_EYES)
		.setStyle(ButtonStyle.Success);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		acceptPrizeButton
	);

	const embed = getWinnersEmbed(giveaway);
	let message: Message<true> | null;

	if (!embed || !winnerIds) {
		await interaction.editReply({
			content: stripIndents`
				${EMOJIS.WARN} This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
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
				${EMOJIS.WARN} I am missing permissions to send messages in ${channel} (${channel.id}).
			`;
		} else {
			content = stripIndents`
				${EMOJIS.WARN} I could not publish the winners in ${channel} (${channel.id}). Please try again.
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
		`Published winners of giveaway #${id} in #${channel.name} (${channel.id})`
	);

	await giveawayManager.edit({
		where: {
			id
		},
		data: {
			winnerMessageId: message.id,
			...lastEditBy(interaction.user)
		}
	});

	await interaction.editReply({
		content: stripIndents`
			${EMOJIS.SPARKS} Done! Published the winners of giveaway #${giveaway.guildRelativeId} in ${channel}!

			Fine. If you don't believe me, [here is a link to it](<${message.url}>).
		`,
		components: [],
		embeds: []
	});
}

export async function republishWinners(
	interaction: RepliableInteraction<"cached">,
	id: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild);

	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.WARN} This giveaway does not exist. Try creating one or double-check the ID.
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
				${EMOJIS.WARN} The channel the giveaway was published in does not exist, or is not a valid channel.
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
		await publishWinners(interaction, id);

		return;
	}

	const winnerIds = getAllWinners(giveaway);

	const embed = getWinnersEmbed(giveaway);

	if (!embed || !winnerIds) {
		await interaction.editReply({
			content: stripIndents`
				${EMOJIS.WARN} This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret".
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const acceptPrizeButton = new ButtonBuilder()
		.setCustomId(`accept-prize-${id}`)
		.setLabel("Accept prize")
		.setEmoji(EMOJIS.STAR_EYES)
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
			id
		},
		data: {
			...lastEditBy(interaction.user)
		}
	});

	await interaction.editReply({
		content: stripIndents`
			${EMOJIS.SPARKS} Done! Republished the winners of giveaway #${giveaway.guildRelativeId} in ${channel}!

			Oh, I almost forgot! [Here is a link to it](<${currentMessage.url}>).
		`,
		components: [],
		embeds: []
	});

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Republished winners of giveaway #${giveaway.id} in #${channel.name} (${channel.id})`
	);
}
