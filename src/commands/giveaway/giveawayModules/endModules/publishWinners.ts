import components from "#components";
import { Emojis } from "#constants";
import GiveawayManager from "#database/giveaway.js";
import Logger from "#logger";
import type GiveawayModule from "#modules/Giveaway.js";
import { oneLine, stripIndents } from "common-tags";
import {
	hideLinkEmbed,
	hyperlink,
	PermissionFlagsBits,
	type Message,
	type MessageCreateOptions,
	type RepliableInteraction
} from "discord.js";
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
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction.editReply({
			content: stripIndents`
				${Emojis.Error} This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
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
				${Emojis.Warn} The channel the giveaway was published in does not exist, or is not a valid channel.
				Try again or republish the giveaway in a new channel.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const giveawayMessage = await giveaway.publishedMessage?.fetch();

	await giveaway.winnerMessage?.delete();

	const rows = components.createRows(components.buttons.acceptPrize(id));

	let message: Message<true> | null;

	if (giveawayMessage) {
		message = await giveawayMessage
			.reply({
				...giveaway.endedEmbed(),
				components: rows
			})
			.catch(() => null);
	} else {
		message = await channel
			.send({
				...giveaway.endedEmbed(),
				components: rows
			})
			.catch(() => null);
	}

	if (!message) {
		let content: string;
		const permsInChannel =
			interaction.guild.members.me?.permissionsIn(channel);

		if (!permsInChannel?.has(PermissionFlagsBits.SendMessages)) {
			content = stripIndents`
				${Emojis.Warn} I am missing permissions to send messages in ${channel} (${channel.id}).
			`;
		} else {
			content = stripIndents`
				${Emojis.Warn} I could not publish the winners in ${channel} (${channel.id}). Please try again.
			`;
		}

		await interaction.editReply({
			components: [],
			content,
			embeds: []
		});

		return;
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
			${Emojis.Sparks} Done! Published the winners of giveaway #${
			giveaway.guildRelativeId
		} in ${channel}!

			Fine. If you don't believe me, ${hyperlink(
				"here is a link to it",
				hideLinkEmbed(message.url)
			)}.
		`
	});

	interaction.editReply({
		components: [],
		embeds: [],
		content: "Notifying the winners..."
	});

	await giveaway.dmWinners({ includeNotified: false });

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
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction.editReply({
			content: stripIndents`
				${Emojis.Error} This giveaway has no prizes, and therefore no winners. Add some prizes, and try again.
				
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
				${Emojis.Warn} The channel the giveaway was published in does not exist, or is not a valid channel.
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

	const rows = components.createRows(components.buttons.acceptPrize(id));

	await currentMessage
		.edit({
			allowedMentions: { users: [...giveaway.winnersUserIds()] },
			content: [...giveaway.winnersUserIds()]
				.map((id) => `<@${id}>`)
				.join(" "),
			embeds: [],
			components: rows
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
			${Emojis.Sparks} Done! Republished the winners of giveaway #${
			giveaway.guildRelativeId
		} in ${channel}!

			Oh, I almost forgot! ${hyperlink(
				"Here is a link to it",
				hideLinkEmbed(currentMessage.url)
			)}.
		`
	});

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Republished winners of giveaway #${giveaway.id} in #${channel.name} (${channel.id})`
	);

	await giveaway.dmWinners({ includeNotified: false });

	toEndedDashboard(interaction, giveawayManager, giveaway);
}

export async function publishOrRepublishWinners(
	giveaway: GiveawayModule,
	{ preferEditing }: { preferEditing: boolean } = { preferEditing: false }
) {
	const rows = components.createRows(
		components.buttons.acceptPrize(giveaway.id)
	);

	const data: Omit<MessageCreateOptions, "flags"> = {
		allowedMentions: { users: [...giveaway.winnersUserIds()] },
		content: [...giveaway.winnersUserIds()]
			.map((id) => `<@${id}>`)
			.join(" "),
		embeds: [],
		components: rows
	};

	let sent = false;

	if (preferEditing && giveaway.winnerMessage) {
		sent = await giveaway.winnerMessage
			.edit(data)
			.then(() => true)
			.catch(() => false);
	}

	if (!sent && giveaway.channel) {
		sent = await giveaway.channel
			.send(data)
			.then(() => true)
			.catch(() => false);
	}

	await giveaway.edit({
		nowOutdated: {
			winnerMessage: false
		}
	});

	giveaway.dmWinners({ includeNotified: false });

	new Logger({
		color: "grey",
		prefix: "PUB WIN",
		guild: giveaway.guild
	}).log(
		`Published winners of giveaway #${giveaway.id}. Sent DMs to winners`
	);
}
