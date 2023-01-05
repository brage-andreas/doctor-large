import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	AttachmentBuilder,
	ComponentType,
	type ButtonBuilder,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import { myGiveawayComponents } from "../../components/index.js";
import { EMOJIS } from "../../constants.js";
import GiveawayManager from "../../database/giveaway.js";
import s from "../../helpers/s.js";
import {
	type GiveawayDataWithIncludes,
	type PrizeDataWithIncludes,
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

const giveawayToShortString = (giveaway: GiveawayDataWithIncludes) => {
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

const stringFromEnteredGiveaways = (
	giveaways: Array<GiveawayDataWithIncludes>
) => {
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

	const giveawayManager = new GiveawayManager(interaction.guild);

	const entered = await giveawayManager.getAll({ entryUserId: id });
	const hosted = await giveawayManager.getAll({ hostUserId: id });

	if (!entered.length && !hosted.length) {
		await interaction
			.reply({
				ephemeral: true,
				content: `${EMOJIS.NO_ENTRY} You have not participated in any giveaways yet!`
			})
			.catch(() => null);

		return;
	}

	await interaction.deferReply({ ephemeral: true });

	// this is so it can update if the user presses the "accept all" button
	const getPrizes = async () =>
		await giveawayManager.getPrizes({ winnerUserId: id });

	const prizes = await getPrizes();

	const theirWonPrizes = (prizes: Array<PrizeDataWithIncludes>) =>
		prizes
			.map((prize) => prizeToWonPrize(prize, id))
			.filter(
				(wonPrizeOrNull) => wonPrizeOrNull !== null
			) as Array<WonPrize>;

	const getContent = (prizes: Array<PrizeDataWithIncludes>) => {
		const prizesStr = theirWonPrizes(prizes).length
			? `\n\n**Won prizes (${
					theirWonPrizes(prizes).length
			  })**\n${wonPrizesToString(theirWonPrizes(prizes))}`
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

		return stripIndents`
			You have entered ${no(entered.length)} ${s("giveaway", entered.length)}.
			You have won ${no(theirWonPrizes(prizes).length)} ${s(
			"prize",
			theirWonPrizes(prizes).length
		)}.

			**Entered giveaways**
			${enteredStr}${prizesStr}

			${hostedStr}
		`;
	};

	const notAcceptedPrizes = await giveawayManager.getPrizes({
		winnerAccepted: false,
		winnerUserId: id
	});

	const acceptAllButton = notAcceptedPrizes.length
		? myGiveawayComponents.acceptAllPrizesButton()
		: undefined;

	const viewAllEnteredButton = entered.length
		? myGiveawayComponents.viewAllEnteredButton()
		: undefined;

	const viewAllPrizesButton = prizes.length
		? myGiveawayComponents.viewAllPrizesButton()
		: undefined;

	const viewAllHostedButton = hosted.length
		? myGiveawayComponents.viewAllHostedButton()
		: undefined;

	const getButtonArray = () =>
		[
			acceptAllButton,
			viewAllEnteredButton,
			viewAllPrizesButton,
			viewAllHostedButton
		].filter(
			(buttonOrNull) => buttonOrNull !== null
		) as Array<ButtonBuilder>;

	const getRows = () => {
		const buttons = getButtonArray();

		return buttons.length
			? [new ActionRowBuilder<ButtonBuilder>().setComponents(...buttons)]
			: [];
	};

	const rows = getRows();

	const msg = await interaction.editReply({
		components: rows,
		content: getContent(prizes),
		embeds: []
	});

	if (!rows.length) {
		return;
	}

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		// if there are 2 buttons, 2 will be max
		// if there are 3 buttons, 3 will be max etc.
		max: getButtonArray().length
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction.reply({
			content: `${EMOJIS.NO_ENTRY} This button is not for you.`,
			ephemeral: true
		});
	});

	collector.on("collect", async (buttonInteraction) => {
		await buttonInteraction.deferReply({ ephemeral: true });

		if (buttonInteraction.customId === "acceptAllPrizes") {
			for (const prize of notAcceptedPrizes) {
				await giveawayManager.updateWinnerAcceptance({
					accepted: true,
					prizeId: prize.id,
					userId: id
				});
			}

			await buttonInteraction.editReply({
				content: getContent(await getPrizes())
			});
		}

		const getAttachment = (string: string) => {
			const { createdAt, createdTimestamp, user, guild } =
				buttonInteraction;

			const userLine = `${user.tag} (${user.id})`;

			const text = stripIndents`
				${createdAt} ${createdTimestamp}
				${guild.name} (${guild.id})
				${userLine}
				${"-".repeat(userLine.length)}
				${string}
			`;

			return new AttachmentBuilder(Buffer.from(text), {
				name: `${user.tag}-entered-giveaways-in-${guild.id}.txt`
			});
		};

		if (buttonInteraction.customId === "viewAllEntered") {
			const string = `Entered giveaways (${
				entered.length
			}):\n${stringFromEnteredGiveaways(entered)}`;

			await buttonInteraction.editReply({
				files: [getAttachment(string)]
			});

			viewAllEnteredButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows(),
				content: getContent(await getPrizes()),
				embeds: []
			});
		}

		if (buttonInteraction.customId === "viewAllPrizes") {
			const prizes_ = await getPrizes();

			const prizesStr = wonPrizesToString(theirWonPrizes(prizes_));

			const string = `Won prizes (${prizes_.length}):\n${prizesStr}`;

			await buttonInteraction.editReply({
				files: [getAttachment(string)]
			});

			viewAllPrizesButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows(),
				content: getContent(await getPrizes()),
				embeds: []
			});
		}

		if (buttonInteraction.customId === "viewAllHosted") {
			const string = "WIP";

			await buttonInteraction.editReply({
				files: [getAttachment(string)]
			});

			viewAllHostedButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows(),
				content: getContent(await getPrizes()),
				embeds: []
			});
		}
	});
};

export const getCommand: () => Command = () => ({
	data,
	run
});
