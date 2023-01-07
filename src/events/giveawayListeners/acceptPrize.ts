import { oneLine, stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { EMOJIS, REGEXP } from "../../constants.js";
import GiveawayManager from "../../database/giveaway.js";
import Logger from "../../logger/logger.js";
import type Prize from "../../modules/Prize.js";

export default async function acceptPrize(
	interaction: ButtonInteraction<"cached">
) {
	const match = interaction.customId.match(REGEXP.ACCEPT_PRIZE_CUSTOM_ID);
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
				${EMOJIS.HEART_BREAK} You don't have any prizes to claim.
				
				Better luck next time.
			`,
			ephemeral: true
		});

		return;
	}

	const prizes = giveaway.prizesOf(userId);

	const prizeToString = (prize: Prize) => {
		const name = `**${prize.name}**`;
		const quantity = `${prize.winners.get(userId)!.quantityWon}x`;
		const additionalInfo = prize.additionalInfo
			? ` | ${prize.additionalInfo}`
			: "";

		return `${quantity} ${name}${additionalInfo}`;
	};

	if (prizes.every((prize) => prize.winners.get(userId)!.accepted)) {
		interaction.followUp({
			content: stripIndents`
				${EMOJIS.V} You have already claimed all your prizes. You're all set! ${
				EMOJIS.GRIN
			}

				I'm sure you win a lot! So in case you need a reminder, you won:
				→ ${prizes.map(prizeToString).join("\n→ ")}
			`,
			ephemeral: true
		});

		return;
	}

	interaction.followUp({
		content: stripIndents`
			${EMOJIS.TADA} You have **now claimed** your prize! Woo!
			
			To remind you of your extraordinary success, you won:
			→ ${prizes.map(prizeToString).join("\n→ ")}
		`,
		ephemeral: true
	});

	new Logger({
		color: "green",
		prefix: "GIVEAWAY"
	}).log(
		oneLine`
			User ${interaction.user.tag} (${userId})
			claimed prizes ${prizes.map((p) => `#${p.id}`).join(", ")}
			in giveaway #${giveaway.id}
		`
	);

	for (const { id } of prizes) {
		await giveawayManager.updateWinnerAcceptance({
			accepted: true,
			prizeId: id,
			userId
		});
	}
}
