import { oneLine, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	type Message,
	type RepliableInteraction
} from "discord.js";
import { EMOJIS } from "../../../../constants.js";
import GiveawayManager from "../../../../database/giveaway.js";
import Logger from "../../../../logger/logger.js";
import toEndedDashboard from "../endedGiveawayDashboard.js";

export async function toPublishWinners(
	interaction: RepliableInteraction<"cached">,
	id: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild);

	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction.editReply({
			content: stripIndents`
				${EMOJIS.ERROR} This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret".
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const { channel } = giveaway;

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

	const giveawayMessage = await giveaway.publishedMessage?.fetch();

	await giveaway.winnerMessage?.delete();

	const acceptPrizeButton = new ButtonBuilder()
		.setCustomId(`accept-prize-${id}`)
		.setLabel("Accept prize")
		.setEmoji(EMOJIS.STAR_EYES)
		.setStyle(ButtonStyle.Success);

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		acceptPrizeButton
	);

	let message: Message<true> | null;

	if (giveawayMessage) {
		message = await giveawayMessage
			.reply({
				...giveaway.endedEmbed(),
				components: [row]
			})
			.catch(() => null);
	} else {
		message = await channel
			.send({
				...giveaway.endedEmbed(),
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

	await giveaway.edit({
		winnerMessageId: message.id,
		nowOutdated: {
			winnerMessage: false
		}
	});

	await interaction.followUp({
		ephemeral: true,
		content: stripIndents`
			${EMOJIS.SPARKS} Done! Published the winners of giveaway #${giveaway.guildRelativeId} in ${channel}!

			Fine. If you don't believe me, [here is a link to it](<${message.url}>).
		`
	});

	toEndedDashboard(interaction, giveawayManager, giveaway);
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
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction.editReply({
			content: stripIndents`
				${EMOJIS.ERROR} This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret".
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const { channel } = giveaway;

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

	const currentMessage = await giveaway.winnerMessage?.fetch();

	if (!currentMessage) {
		await toPublishWinners(interaction, id);

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
			allowedMentions: { users: [...giveaway.winnersUserIds()] },
			content: [...giveaway.winnersUserIds()]
				.map((id) => `<@${id}>`)
				.join(" "),
			embeds: [],
			components: [row]
		})
		.catch(() => null);

	await giveaway.edit({
		nowOutdated: {
			winnerMessage: false
		}
	});

	await interaction.followUp({
		ephemeral: true,
		content: stripIndents`
			${EMOJIS.SPARKS} Done! Republished the winners of giveaway #${giveaway.guildRelativeId} in ${channel}!

			Oh, I almost forgot! [Here is a link to it](<${currentMessage.url}>).
		`
	});

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Republished winners of giveaway #${giveaway.id} in #${channel.name} (${channel.id})`
	);

	toEndedDashboard(interaction, giveawayManager, giveaway);
}
