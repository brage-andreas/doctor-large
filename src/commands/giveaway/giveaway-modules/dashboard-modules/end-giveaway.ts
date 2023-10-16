import { type ButtonInteraction, ButtonStyle, bold, time } from "discord.js";
import { oneLine, stripIndent, stripIndents } from "common-tags";
import type GiveawayManager from "#database/giveaway.js";
import toDashboard from "../giveaway-dashboard.js";
import components from "#components";
import { Emojis } from "#constants";
import { s, yesNo } from "#helpers";
import Logger from "#logger";

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
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
				embeds: [],
			})
			.catch(() => null);

		return;
	}

	const prizesN = giveaway.prizesQuantity();
	const winnersN = giveaway.winnerQuantity;

	if (!prizesN) {
		await interaction
			.followUp({
				content: stripIndents`
				${Emojis.Error} This giveaway has no prizes. Add some prizes, and try again.
				
				If the prize(s) are a secret, you can for example name the prize "Secret"
			`,
				ephemeral: true,
			})
			.catch(() => null);

		void toDashboard(interaction, id);

		return;
	}

	if (!giveaway.channelId) {
		await interaction
			.followUp({
				content: `${Emojis.Warn} The giveaway has never been announced.`,
				ephemeral: true,
			})
			.catch(() => null);

		void toDashboard(interaction, id);

		return;
	}

	let content = stripIndent`
		Are you sure you want to end giveaway ${giveaway.asRelId}?
		
		This will lock the entries and deactivate the giveaway.
	`;

	if (giveaway.endDate) {
		const isWas = Number(giveaway.endDate) < Date.now() ? "is" : "was";

		content += `\nThe giveaway ${isWas} set to end ${time(giveaway.endDate, "R")}.`;
	}

	if (prizesN < winnersN) {
		content += "\n\n";
		content += oneLine`
			${Emojis.Warn} There are not enough prizes for
			${bold(winnersN.toString())} ${s("winner", winnersN)}!
			There will be ${bold(prizesN.toString())} ${s("winner", prizesN)} instead.
		`;
	}

	const confirmation = await yesNo({
		data: {
			components: [],
			content,
			embeds: [],
		},
		filter: (index) => index.user.id === interaction.user.id,
		medium: interaction,
		noStyle: ButtonStyle.Secondary,
		timeActive: 60_000,
		yesStyle: ButtonStyle.Secondary,
	});

	if (!confirmation) {
		await interaction
			.followUp({
				content: "Alright! Ending the giveaway was canceled.",
				ephemeral: true,
			})
			.catch(() => null);

		void toDashboard(interaction, id);

		return;
	}

	await giveaway.edit({
		ended: true,
		entriesLocked: true,
		nowOutdated: {
			announcementMessage: false,
		},
	});

	const endedGiveawayRows = components.createRows(components.buttons.endedGiveaway.component());

	await giveaway.announcementMessage?.edit({
		allowedMentions: { parse: ["roles", "everyone"] },
		components: endedGiveawayRows,
		content: giveaway.pingRolesMentions?.join(" "),
		embeds: [giveaway.toEmbed()],
	});

	new Logger({
		color: "red",
		interaction,
		label: "GIVEAWAY",
	}).log(`Ended giveaway #${id}`);

	await toDashboard(interaction, id);
}
