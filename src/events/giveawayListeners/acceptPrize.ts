import { type Prize, type Winner } from "@prisma/client";
import { oneLine, stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
import { getAllWinners } from "../../commands/giveaway/giveawayModules/endModules/getWinners.js";
import { EMOJIS, REGEXP } from "../../constants.js";
import GiveawayManager from "../../database/giveaway.js";
import theirPrizes from "../../helpers/theirPrizes.js";
import Logger from "../../logger/logger.js";

export default async function acceptPrize(
	interaction: ButtonInteraction<"cached">
) {
	const id = interaction.customId.match(REGEXP.ACCEPT_PRIZE_CUSTOM_ID)?.groups
		?.id;

	if (!id) {
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const giveawayManager = new GiveawayManager(interaction.guildId);

	const giveaway = await giveawayManager.get(Number(id));

	if (!giveaway) {
		return;
	}

	const rawWinners = getAllWinners(giveaway);

	if (!rawWinners) {
		interaction.followUp({
			ephemeral: true,
			content: `${EMOJIS.WARN} Could not find the winners. Contact an admin if this error persists.`
		});

		return;
	}

	const winners = new Set(rawWinners);

	if (!winners.has(interaction.user.id)) {
		interaction.followUp({
			content: stripIndents`
				${EMOJIS.HEART_BREAK} You don't have any prizes to claim.
				
				Better luck next time.
			`,
			ephemeral: true
		});

		return;
	}

	const prizes = theirPrizes(giveaway, interaction.user.id);

	const prizeToString = (prize: Prize & { winners: Array<Winner> }) => {
		const name = `**${prize.name}**`;
		const quantity = `${prize.winners[0].quantityWon}x`;
		const additionalInfo = prize.additionalInfo
			? ` | ${prize.additionalInfo}`
			: "";

		return `${quantity} ${name}${additionalInfo}`;
	};

	if (prizes.every((prize) => prize.winners[0].accepted)) {
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
			User ${interaction.user.tag} (${interaction.user.id})
			claimed prizes ${prizes.map((p) => `#${p.id}`).join(", ")}
			in giveaway #${giveaway.id}
		`
	);

	const prizeIds = giveaway.prizes
		.filter((prize) =>
			prize.winners.some(
				(winner) => winner.userId === interaction.user.id
			)
		)
		.map((prize) => prize.id);

	for (const id of prizeIds) {
		await giveawayManager.updateWinnerAcceptance({
			accepted: true,
			prizeId: id,
			userId: interaction.user.id
		});
	}
}
