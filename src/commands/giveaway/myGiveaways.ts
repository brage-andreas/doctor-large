import { stripIndents } from "common-tags";
import { type RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { EMOJIS } from "../../constants.js";
import GiveawayManager from "../../database/giveaway.js";
import s from "../../helpers/s.js";
import {
	type GiveawayWithIncludes,
	type WonPrize
} from "../../typings/database.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../../typings/index.js";
import { getWinnersAndTheirPrizes } from "./giveawayModules/endModules/getWinners.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "my-giveaways",
	dm_permission: false,
	description: "View all the giveaways you have participated in."
};

const no = (n: number) => (n ? `**${n}**` : "no");

const giveawayToShortString = (giveaway: GiveawayWithIncludes) => {
	const { id: gId, title, winnerQuantity, prizes } = giveaway;
	const id = `#${gId}`;
	const winners = `${winnerQuantity} ${s("winner", winnerQuantity)}`;
	const prizesQuantity = prizes.reduce(
		(acc, prize) => acc + prize.quantity,
		0
	);

	return `${id} **${title}** - ${winners}, ${prizesQuantity} ${s(
		"prize",
		prizesQuantity
	)}`;
};

const stringFromEnteredGiveaways = (giveaways: Array<GiveawayWithIncludes>) => {
	const activeGiveaways = giveaways
		.filter((g) => g.active)
		.map(giveawayToShortString);

	const inactiveGiveaways = giveaways
		.filter((g) => !g.active)
		.map(giveawayToShortString);

	const strArray = [];

	if (activeGiveaways.length) {
		strArray.push(
			`Active (${activeGiveaways.length}):\n→ ${activeGiveaways.join(
				"\n→ "
			)}`
		);
	}

	if (inactiveGiveaways.length) {
		strArray.push(
			`Inactive (${
				inactiveGiveaways.length
			}):\n→ ${inactiveGiveaways.join("\n→ ")}`
		);
	}

	return strArray.join("\n\n");
};

const wonPrizesToString = (wonPrizes: Array<WonPrize>) =>
	wonPrizes
		.map((wonPrize) => {
			const { name, quantityWon, accepted } = wonPrize;
			const emoji = accepted ? EMOJIS.V : `${EMOJIS.X} Not accepted`;

			return `→ ${quantityWon} ${name} (${emoji})`;
		})
		.join("\n");

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const id = interaction.user.id;

	const giveawayManager = new GiveawayManager(interaction.guildId);
	const allGiveaways = await giveawayManager.getAll();

	const [entered, hosted] = allGiveaways.reduce(
		(giveawayArray, giveaway) => {
			const isEntered = giveaway.entriesUserIds.includes(id);
			const isHost = giveaway.hostUserId === id;

			if (isEntered) {
				giveawayArray[0].push(giveaway);
			} else if (isHost) {
				giveawayArray[1].push(giveaway);
			}

			return giveawayArray;
		},
		[[], []] as [Array<GiveawayWithIncludes>, Array<GiveawayWithIncludes>]
	);

	if (!entered.length && !hosted.length) {
		await interaction
			.reply({
				components: [],
				ephemeral: true,
				content: "😶‍🌫️ You have not participated in any giveaways yet!",
				embeds: []
			})
			.catch(() => null);

		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const theirWonPrizes = entered
		.sort((a, b) => b.id - a.id)
		.slice(0, 5)
		.filter((g) =>
			g.prizes.some((p) => p.winners.some((w) => w.userId === id))
		)
		.flatMap((g) => getWinnersAndTheirPrizes(g).get(id)!);

	const prizesStr = theirWonPrizes.length
		? `\n\n**Won prizes (${theirWonPrizes.length})**\n${wonPrizesToString(
				theirWonPrizes
		  )}`
		: "";

	const enteredStr = entered.length
		? stringFromEnteredGiveaways(entered)
		: "None. 😢";

	const hostEntries = hosted.reduce(
		(acc, g) => acc + g.entriesUserIds.length,
		0
	);

	const hostedStr = hosted.length
		? stripIndents`
			**Hosted giveaways**
			You have hosted **${hosted.length}** ${s(
				"giveaway",
				hosted.length
		  )} with a total of **${hostEntries}** ${
				hostEntries === 1 ? "entry" : "entries"
		  }.
		`
		: "";

	const content = stripIndents`
		You have entered ${no(entered.length)} ${s("giveaway", entered.length)}.
		You have won ${no(theirWonPrizes.length)} ${s("prize", theirWonPrizes.length)}.

		**Entered giveaways**
		${enteredStr}${prizesStr}

		${hostedStr}
	`;

	interaction.editReply({
		components: [],
		content,
		embeds: []
	});
};

export const getCommand: () => Command = () => ({
	data,
	run
});
