import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
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
import { prizeToWonPrize } from "./giveawayModules/endModules/getWinners.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "my-giveaways",
	dm_permission: false,
	description: "View all the giveaways you have participated in.",
	options: [
		{
			name: "hide",
			description: "Whether to hide this command (True)",
			type: ApplicationCommandOptionType.Boolean
		}
	]
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
			const emoji = !accepted ? ` (${EMOJIS.WARN} Not accepted)` : "";

			return `→ ${quantityWon} ${name} (${emoji})`;
		})
		.join("\n");

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const id = interaction.user.id;

	const giveawayManager = new GiveawayManager(interaction.guildId);

	const entered = await giveawayManager.getAll({ entryUserId: id });
	const hosted = await giveawayManager.getAll({ hostUserId: id });

	if (!entered.length && !hosted.length) {
		await interaction
			.reply({
				components: [],
				ephemeral: true,
				content: `${EMOJIS.NO_ENTRY} You have not participated in any giveaways yet!`,
				embeds: []
			})
			.catch(() => null);

		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const prizes = await giveawayManager.getPrizes({ winnerUserId: id });

	const notAcceptedPrizes = await giveawayManager.getPrizes({
		winnerAccepted: false,
		winnerUserId: id
	});

	const theirWonPrizes = prizes
		.flatMap((prize) => prizeToWonPrize(prize, id))
		.filter((wonPrizeOrNull) => wonPrizeOrNull !== null) as Array<WonPrize>;

	const prizesStr = theirWonPrizes.length
		? `\n\n**Won prizes (${theirWonPrizes.length})**\n${wonPrizesToString(
				theirWonPrizes
		  )}`
		: "";

	const enteredStr = entered.length
		? stringFromEnteredGiveaways(entered)
		: `None. ${EMOJIS.CRY}`;

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

	const acceptAllButton = notAcceptedPrizes.length
		? new ButtonBuilder()
				.setCustomId("acceptAllPrizes")
				.setEmoji(EMOJIS.TADA)
				.setLabel("Accept all prizes")
				.setStyle(ButtonStyle.Success)
		: undefined;

	const viewAllEnteredButton = entered.length
		? new ButtonBuilder()
				.setCustomId("viewAllEntered")
				.setLabel("View entered")
				.setStyle(ButtonStyle.Secondary)
		: undefined;

	const viewAllPrizes = prizes.length
		? new ButtonBuilder()
				.setCustomId("viewAllPrizes")
				.setLabel("View prizes")
				.setStyle(ButtonStyle.Secondary)
		: undefined;

	const viewAllHosted = hosted.length
		? new ButtonBuilder()
				.setCustomId("viewAllHosted")
				.setLabel("View hosted")
				.setStyle(ButtonStyle.Secondary)
		: undefined;

	const buttonArray = [
		acceptAllButton,
		viewAllEnteredButton,
		viewAllPrizes,
		viewAllHosted
	].filter((buttonOrNull) => buttonOrNull !== null) as Array<ButtonBuilder>;

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		...buttonArray
	);

	interaction.editReply({
		components: buttonArray.length ? [row] : [],
		content,
		embeds: []
	});
};

export const getCommand: () => Command = () => ({
	data,
	run
});
