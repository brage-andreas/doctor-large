import { Emojis, Regex } from "#constants";
import GiveawayManager from "#database/giveaway.js";
import commandMention from "#helpers/commandMention.js";
import Logger from "#logger";
import { oneLine, stripIndents } from "common-tags";
import { bold, type ButtonInteraction } from "discord.js";

export default async function acceptPrize(
	interaction: ButtonInteraction<"cached">
) {
	const match = interaction.customId.match(Regex.AcceptPrizeCustomId);
	const prizeId = match?.groups?.id;

	if (!prizeId) {
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const giveawayManager = new GiveawayManager(interaction.guild);

	const giveaway = await giveawayManager.get(Number(prizeId));

	if (!giveaway) {
		return;
	}

	const userId = interaction.user.id;

	if (!giveaway.winnersUserIds().has(userId)) {
		interaction.followUp({
			content: stripIndents`
				${Emojis.HeartBreak} You don't have any prizes to claim.
				
				Better luck next time.
			`,
			ephemeral: true
		});

		return;
	}

	const prizes = giveaway.prizesOf(userId);

	const myGiveaways = await commandMention("my-giveaway", interaction);

	if (!prizes?.unclaimed.size) {
		interaction.followUp({
			content: stripIndents`
				${Emojis.Check} You have already claimed all your prizes. You're all set! ${Emojis.Grin}

				Use ${myGiveaways} if you need a reminder of what your extraordinary success.
			`,
			ephemeral: true
		});

		return;
	}

	interaction.followUp({
		content: stripIndents`
			${Emojis.Tada} You have ${bold("now claimed")} your prize! Woo!
			
			Use ${myGiveaways} if you need a reminder of what your extraordinary success.
		`,
		ephemeral: true
	});

	new Logger({
		color: "green",
		prefix: "GIVEAWAY"
	}).log(
		oneLine`
			User ${interaction.user.tag} (${userId})
			claimed prizes ${[...prizes.unclaimed.keys()]
				.map((prizeId) => `#${prizeId}`)
				.join(", ")}
			in giveaway #${giveaway.id}
		`
	);

	for (const { prize } of [...prizes.unclaimed.values()]) {
		await giveawayManager.setWinnerClaimed({
			claimed: true,
			prizeId: prize.id,
			userId
		});
	}
}
