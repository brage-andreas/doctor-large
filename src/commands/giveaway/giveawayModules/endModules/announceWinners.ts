import components from "#components";
import { Emojis } from "#constants";
import GiveawayManager from "#database/giveaway.js";
import getMissingPermissions from "#helpers/getMissingPermissions.js";
import Logger from "#logger";
import type GiveawayModule from "#modules/Giveaway.js";
import { oneLine, stripIndents } from "common-tags";
import {
	type Message,
	type MessageCreateOptions,
	type RepliableInteraction
} from "discord.js";
import toEndedDashboard from "../endedGiveawayDashboard.js";

export async function toAnnounceWinners(
	interaction: RepliableInteraction<"cached">,
	id: number
) {
	const giveawayManager = new GiveawayManager(interaction.guild);

	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	if (!giveaway.prizesQuantity()) {
		await interaction.editReply({
			embeds: [],
			content: stripIndents`
				${Emojis.Error} This giveaway has no prizes, and therefore it can have no winners. Add prizes, and try again.
				
				If the prize is a secret, you can name the prize "Secret" or similar.
			`,
			components: []
		});

		return;
	}

	const { channel } = giveaway;

	if (!channel?.isTextBased()) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				${Emojis.Error} The channel the giveaway is announced in does not exist, or is not a valid channel.
				Try again or reannounce the giveaway in a new channel.
			`,
			embeds: []
		});

		return;
	}

	const missingPerms = getMissingPermissions(
		channel,
		"SendMessages",
		"EmbedLinks"
	);

	if (missingPerms.length) {
		await interaction.editReply({
			components: [],
			content: oneLine`
				${Emojis.Error} I am missing permissions in
				${channel}. Permissions needed: ${missingPerms.join(", ")}
			`,
			embeds: []
		});

		return;
	}

	const giveawayMessage = await giveaway.announcementMessage?.fetch();

	await giveaway.winnerMessage?.delete();

	const acceptPrizeRows = components.createRows(
		components.buttons.acceptPrize(id)
	);

	let message: Message<true> | null;

	if (giveawayMessage) {
		message = await giveawayMessage
			.reply({
				...giveaway.endedEmbed(),
				components: acceptPrizeRows
			})
			.catch(() => null);
	} else {
		message = await channel
			.send({
				...giveaway.endedEmbed(),
				components: acceptPrizeRows
			})
			.catch(() => null);
	}

	if (!message) {
		await interaction.editReply({
			components: [],
			content: oneLine`
				${Emojis.Warn} I could not announce the winners in
				${channel} (${channel.id}). Please try again.
			`,
			embeds: []
		});

		return;
	}

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Announced winners of giveaway #${id} in #${channel.name} (${channel.id})`
	);

	await giveaway.edit({
		winnerMessageId: message.id,
		nowOutdated: {
			winnerMessage: false
		}
	});

	const urlButtonRows = components.createRows(
		components.buttons.url({
			label: "Go to announcement",
			url: message.url
		})
	);

	await interaction.followUp({
		components: urlButtonRows,
		content: `${Emojis.Sparks} Done! Announced the winners of giveaway ${giveaway.asRelId} in ${channel}!`,
		ephemeral: true
	});

	interaction.editReply({
		components: [],
		embeds: [],
		content: "Notifying the winners..."
	});

	await giveaway.dmWinners({ includeNotified: false });

	toEndedDashboard(interaction, giveawayManager, giveaway);
}

export async function reannounceWinners(
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
				${Emojis.Warn} The channel the giveaway is announced in does not exist or is not a valid channel.
				Try again or reannounce the giveaway in a new channel.
			`,
			components: [],
			embeds: []
		});

		return;
	}

	const currentMessage = await giveaway.winnerMessage?.fetch();

	if (!currentMessage) {
		await toAnnounceWinners(interaction, id);

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

	const urlButtonRows = components.createRows(
		components.buttons.url({
			label: "Go to announcement",
			url: currentMessage.url
		})
	);

	await interaction.followUp({
		components: urlButtonRows,
		content: `${Emojis.Sparks} Done! Reannounced the winners of giveaway ${giveaway.asRelId} in ${channel}!`,
		ephemeral: true
	});

	new Logger({
		prefix: "GIVEAWAY"
	}).log(
		`Reannounced winners of giveaway #${giveaway.id} in #${channel.name} (${channel.id})`
	);

	await giveaway.dmWinners({ includeNotified: false });

	toEndedDashboard(interaction, giveawayManager, giveaway);
}

export async function autoAnnounceWinners(
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
		prefix: "GIVEAWAY",
		guild: giveaway.guild
	}).log(
		`Automatically announced winners of giveaway #${giveaway.id}. Sent DMs to winners`
	);
}
