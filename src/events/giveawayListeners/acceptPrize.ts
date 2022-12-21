import { type giveawayPrize, type giveawayWinner } from "@prisma/client";
import { oneLine, stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { EMOJIS, REGEXP } from "../../constants.js";
import GiveawayManager from "../../database/giveaway.js";
import Logger from "../../logger/logger.js";

export default async function acceptPrize(
	interaction: ButtonInteraction<"cached">
) {
	const giveawayId = interaction.customId.match(REGEXP.ACCEPT_PRIZE_CUSTOM_ID)
		?.groups?.id;

	if (!giveawayId) {
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const giveawayManager = new GiveawayManager(interaction.guildId);

	const giveaway = await giveawayManager.get(Number(giveawayId));

	if (!giveaway) {
		return;
	}

	const winners = new Set(
		giveaway.prizes
			.map((prize) => prize.winner?.userId)
			.filter((e) => Boolean(e))
	);

	if (!winners.has(interaction.user.id)) {
		interaction.followUp({
			content: stripIndents`
				💔 You don't have any prizes to claim.
				
				Better luck next time.
			`,
			ephemeral: true
		});

		return;
	}

	const prizeToString = (prize: giveawayPrize) => {
		const name = `**${prize.name}**`;
		const amount = `${prize.amount}x`;
		const additionalInfo = prize.additionalInfo
			? ` | ${prize.additionalInfo}`
			: "";

		return `${amount} ${name}${additionalInfo}`;
	};

	const rawPrizes = giveaway.prizes.filter(
		(prize) => prize.winner?.userId === interaction.user.id
	);

	if (
		!rawPrizes.length ||
		!rawPrizes.some((prize) => Boolean(prize.winner))
	) {
		interaction.followUp({
			content: stripIndents`
				⚠️ Something went wrong. Please try again.
				
				If the error persists, contact the giveaway's host or an admin.
			`,
			ephemeral: true
		});

		return;
	}

	const prizes = rawPrizes as Array<
		giveawayPrize & { winner: giveawayWinner }
	>;

	if (prizes.every((prize) => prize.winner.accepted)) {
		interaction.followUp({
			content: stripIndents`
				${EMOJIS.V} You have already claimed all your prizes. You're all set! 😁

				I'm sure you win a lot! So in case you need a reminder, you won:
				→ ${prizes.map(prizeToString).join("\n→ ")}
			`,
			ephemeral: true
		});

		return;
	}

	interaction.followUp({
		content: stripIndents`
			🎉 You have **now claimed** your prize! Woo!
			
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
			User ${interaction.user.tag} (${interaction.user.id})
			claimed prizes ${prizes.map((p) => `#${p.prizeId}`).join(", ")}
			in giveaway #${giveaway.giveawayId}
		`
	);

	giveawayManager.editWinner({
		where: {
			userId_giveawayId: {
				giveawayId: giveaway.giveawayId,
				userId: prizes[0].winner.userId
			}
		},
		data: {
			accepted: true
		}
	});
}
