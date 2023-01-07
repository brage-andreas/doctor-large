import { source, stripIndents } from "common-tags";
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
import type Giveaway from "../../modules/Giveaway.js";
import type Prize from "../../modules/Prize.js";
import {
	type Command,
	type CommandModuleInteractions
} from "../../typings/index.js";

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

const stringFromEnteredGiveaways = (giveaways: Array<Giveaway>) => {
	const activeGiveaways = giveaways
		.filter((g) => g.active)
		.map((g) => g.toShortString());

	const inactiveGiveaways = giveaways
		.filter((g) => !g.active)
		.map((g) => g.toShortString());

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

const prizeToString = (prize: Prize, winnerUserId: string) => {
	const winner = prize.winners.get(winnerUserId);

	if (!winner) {
		return null;
	}

	const emoji = !winner.accepted ? ` (${EMOJIS.WARN} Not accepted)` : "";

	return `→ ${winner.quantityWon} ${prize.name}${emoji}`;
};

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const hide = interaction.options.getBoolean("hide") ?? true;

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

	await interaction.deferReply({ ephemeral: hide });

	// this is so it can update if the user presses the "accept all" button
	const getPrizes = async () =>
		await giveawayManager.getPrizes({ winnerUserId: id });

	const prizes = await getPrizes();

	const getContent = (prizes: Array<Prize>) => {
		const prizesStr = prizes.length
			? `\n\n**Won prizes (${prizes.length})**\n→ ${prizes
					.map((prize) => prize.toShortString())
					.join("\n→ ")}`
			: "";

		const enteredStr = entered.length
			? stringFromEnteredGiveaways(entered)
			: `None. ${EMOJIS.CRY}`;

		const hostEntries = hosted.reduce(
			(acc, g) => acc + g.entriesUserIds.size,
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
			You have won ${no(prizes.length)} ${s("prize", prizes.length)}.

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
		: null;

	const viewAllEnteredButton = entered.length
		? myGiveawayComponents.viewAllEnteredButton()
		: null;

	const viewAllPrizesButton = prizes.length
		? myGiveawayComponents.viewAllPrizesButton()
		: null;

	const viewAllHostedButton = hosted.length
		? myGiveawayComponents.viewAllHostedButton()
		: null;

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
			? [new ActionRowBuilder<ButtonBuilder>().setComponents(buttons)]
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

	collector.on("end", (_, reason) => {
		if (reason !== "time") {
			return;
		}

		interaction.editReply({ components: [] }).catch(() => null);
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

			// +8 is for the "User: .." prefix
			const text = source`
				Server: ${guild.name} (${guild.id})
				  Date: ${createdAt.toUTCString()} (${createdTimestamp})
				  User: ${userLine}
				${"-".repeat(userLine.length + 8)}
				${string}
			`;

			return new AttachmentBuilder(Buffer.from(text), {
				name: `giveaways-${user.tag}-in-${guild.id}.txt`
			});
		};

		if (buttonInteraction.customId === "viewAllEntered") {
			const string = source`
				Entered giveaways (${entered.length}):
				
				${entered.map((giveaway) => giveaway.toFullString()).join("\n\n")}
			`;

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

			const prizesStr = prizes_
				.map((prize_) => prizeToString(prize_, id))
				.join("\n");

			const string = `Won prizes (${prizes_.length}):\n\n${prizesStr}`;

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
			const string = source`
				Hosted giveaways (${hosted.length}):
				
				${hosted.map((giveaway) => giveaway.toFullString()).join("\n\n")}
			`;

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
