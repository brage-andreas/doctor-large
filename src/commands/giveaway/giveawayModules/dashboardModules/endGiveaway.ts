import { oneLine, stripIndent, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonStyle,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import components from "../../../../components/index.js";
import { EMOJIS } from "../../../../constants.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import s from "../../../../helpers/s.js";
import { timestamp } from "../../../../helpers/timestamps.js";
import yesNo from "../../../../helpers/yesNo.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";
import toEndOptions from "./endOptions.js";

export default async function toEndGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction
			.editReply({
				components: [],
				content: stripIndents`
				How did we get here?
			
				${EMOJIS.ERROR} This giveaway does not exist. Try creating one or double-check the ID.
			`,
				embeds: []
			})
			.catch(() => null);

		return;
	}

	const prizesN = giveaway.prizesQuantity();
	const winnersN = giveaway.winnerQuantity;

	if (!prizesN) {
		await interaction
			.followUp({
				ephemeral: true,
				content: stripIndents`
				${EMOJIS.ERROR} This giveaway has no prizes. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret"
			`
			})
			.catch(() => null);

		return toDashboard(interaction, id);
	}

	if (!giveaway.channelId) {
		await interaction
			.followUp({
				ephemeral: true,
				content: `${EMOJIS.WARN} The giveaway has never been published.`
			})
			.catch(() => null);

		return toDashboard(interaction, id);
	}

	let content = stripIndent`
		Are you sure you want to end giveaway #${giveaway.guildRelativeId}?
		
		This will lock the entries and deactivate the giveaway.
	`;

	if (giveaway.endDate) {
		const isWas = Number(giveaway.endDate) < Date.now() ? "is" : "was";
		const time = timestamp(giveaway.endDate, "R");

		content += `\nThe giveaway ${isWas} set to end ${time}.`;
	}

	if (prizesN < winnersN) {
		content += "\n\n";
		content += oneLine`
			${EMOJIS.WARN} There are not enough prizes for
			**${winnersN}** ${s("winner", winnersN)}!
			There will be **${prizesN}** ${s("winner", prizesN)} instead.
		`;
	}

	const confirmation = await yesNo({
		filter: (i) => i.user.id === interaction.user.id,
		yesStyle: ButtonStyle.Secondary,
		noStyle: ButtonStyle.Secondary,
		medium: interaction,
		timeActive: 60_000,
		data: {
			components: [],
			content,
			embeds: []
		}
	});

	if (!confirmation) {
		await interaction
			.followUp({
				ephemeral: true,
				content: "Alright! Ending the giveaway was canceled."
			})
			.catch(() => null);

		return toEndOptions(interaction, id, giveawayManager);
	}

	await giveaway.edit({
		ended: true,
		entriesLocked: true,
		nowOutdated: {
			publishedMessage: false
		}
	});

	const endedGiveawayRow =
		new ActionRowBuilder<ButtonBuilder>().setComponents(
			components.buttons.endedGiveaway.component()
		);

	await giveaway.publishedMessage?.edit({
		allowedMentions: { parse: ["roles", "everyone"] },
		components: [endedGiveawayRow],
		content: giveaway.pingRolesMentions?.join(" "),
		embeds: [giveaway.toEmbed()]
	});

	new Logger({
		prefix: "GIVEAWAY",
		color: "red",
		interaction
	}).log(`Ended giveaway #${id}`);

	await toEndOptions(interaction, id, giveawayManager);
}
