import { source } from "common-tags";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ComponentType,
	EmbedBuilder,
	type ButtonBuilder,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import components from "../../components/index.js";
import { EMOJIS } from "../../constants.js";
import GiveawayManager from "../../database/giveaway.js";
import hideOption from "../../helpers/hideOption.js";
import Logger from "../../logger/logger.js";
import {
	type Command,
	type CommandModuleInteractions,
	type GiveawayId,
	type PrizesOfMapObj
} from "../../typings/index.js";

const data: RESTPostAPIApplicationCommandsJSONBody = {
	name: "my-giveaways",
	dm_permission: false,
	description: "View all the giveaways you have participated in.",
	options: [hideOption]
};

const run = async (interaction: CommandModuleInteractions) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const hide = interaction.options.getBoolean("hide") ?? true;

	const logger = new Logger({ prefix: "MY GIVEAWAYS", interaction });

	const giveawayManager = new GiveawayManager(interaction.guild);

	const { id } = interaction.user;

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

	let allPrizesAccepted = true;
	let winCount = 0;

	const prizeCount = {
		all: 0,
		claimed: 0,
		unclaimed: 0
	};

	const prizes = entered.reduce(
		(map, g) => {
			const prizes = g.prizesOf(id);

			if (!prizes?.claimed.size && !prizes?.unclaimed.size) {
				return map;
			}

			const old = map.get(g.guildRelativeId) ?? {
				claimed: [],
				unclaimed: []
			};

			if (allPrizesAccepted && prizes.unclaimed.size) {
				allPrizesAccepted = true;
			}

			map.set(g.guildRelativeId, {
				claimed: old.claimed.concat([...prizes.claimed.values()]),
				unclaimed: old.unclaimed.concat([...prizes.unclaimed.values()])
			});

			prizeCount.all += prizes.claimed.size + prizes.unclaimed.size;
			prizeCount.claimed += prizes.claimed.size;
			prizeCount.unclaimed += prizes.unclaimed.size;

			winCount++;

			return map;
		},
		new Map<
			GiveawayId,
			{
				claimed: Array<PrizesOfMapObj>;
				unclaimed: Array<PrizesOfMapObj>;
			}
		>()
	);

	await interaction.deferReply({ ephemeral: hide });

	const { acceptAllPrizes, viewAllEntered, viewAllPrizes, viewAllHosted } =
		components.buttons;

	const acceptAllPrizesButton = !allPrizesAccepted
		? acceptAllPrizes.component()
		: null;

	const viewAllEnteredButton = entered.length
		? viewAllEntered.component()
		: null;

	const viewAllPrizesButton = prizes.size ? viewAllPrizes.component() : null;

	const viewAllHostedButton = hosted.length
		? viewAllHosted.component()
		: null;

	const getButtonArray = () =>
		[
			acceptAllPrizesButton,
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

	const prizesArr = (noLimits?: true) =>
		[...prizes.entries()].map(([id, { claimed, unclaimed }]) => {
			const arr = [...unclaimed, ...claimed].map((p, i, arr) => {
				const { name } = p.prize;
				const claim = p.winner.claimed;

				const str = `${p.count}x ${name}${claim ? " (UNCLAIMED)" : ""}`;

				return `${i === arr.length - 1 ? "└─" : "├─"} ${str}`;
			});

			if (noLimits) {
				return source`
				Giveaway #${id}:
				  ${arr.join("\n")}
			`;
			}

			return source`
				Giveaway #${id}:
				  ${arr.slice(0, 10).join("\n")}
				  ${10 < arr.length ? `... and ${arr.length - 10} more` : ""}
			`;
		});

	const MAX_LEN = 3900; // arbitrary - must be 4096 or under but there are also fields;
	let description = "";

	for (const chunk of prizesArr()) {
		if (MAX_LEN <= description.length + chunk.length) {
			break;
		}

		description += `\n\n${chunk}`;
	}

	const embed = new EmbedBuilder()
		.setTitle("My Giveaways")
		.setDescription(description || "You have no prizes.")
		.setFields({
			name: "Stats",
			value: source`
					Entered: ${entered.length}
					  └─ Won: ${winCount}
					Hosted: ${hosted.length}
					Prizes: ${prizeCount.all}
					  ├─ Claimed: ${prizeCount.claimed}
					  └─ Unclaimed: ${prizeCount.unclaimed}
				`
		});

	const rows = getRows();

	const msg = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed]
	});

	logger.log("Sent overview");

	if (!rows.length) {
		return;
	}

	const collector = msg.createMessageComponentCollector({
		filter: (buttonInteraction) =>
			buttonInteraction.user.id === interaction.user.id,
		componentType: ComponentType.Button,
		time: 120_000,
		// If there are 2 buttons, 3 will be max
		// If there are 3 buttons, 4 will be max etc.
		// One more since accepting all prizes will let you see prizes again
		max: getButtonArray().length + 1
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
		await buttonInteraction.deferUpdate();

		let n = 0;

		if (buttonInteraction.customId === acceptAllPrizes.customId) {
			const unclaimed = [...prizes.values()].flatMap((p) => p.unclaimed);

			for (const obj of unclaimed) {
				await giveawayManager.setWinnerClaimed({
					claimed: true,
					prizeId: obj.prize.id,
					userId: interaction.user.id
				});

				n++;
			}

			logger.log(
				`Bulk-accepted ${n} prize(s): ${unclaimed
					.map((p) => p.prize.id)
					.join(", ")}`
			);

			acceptAllPrizesButton?.setDisabled(true);
			viewAllPrizesButton?.setDisabled(false);

			await buttonInteraction.followUp({
				ephemeral: true,
				content: `${EMOJIS.SPARKS} Accepted all prizes!`
			});

			collector.stop();

			return run(interaction);
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
				name: `giveaways_${guild.id}_${user.id}.txt`
			});
		};

		if (buttonInteraction.customId === viewAllEntered.customId) {
			const string = source`
				Entered giveaways (${entered.length}):
				
				${entered.map((giveaway) => giveaway.toFullString()).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				files: [getAttachment(string)]
			});

			viewAllEnteredButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows(),
				content: null,
				embeds: [embed]
			});
		}

		if (buttonInteraction.customId === viewAllPrizes.customId) {
			const prizes = prizesArr(true).join("\n\n");

			const string = `Won prizes (${prizeCount}):\n\n${prizes}`;

			await buttonInteraction.followUp({
				files: [getAttachment(string)]
			});

			viewAllPrizesButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows(),
				content: null,
				embeds: [embed]
			});
		}

		if (buttonInteraction.customId === viewAllHosted.customId) {
			const string = source`
				Hosted giveaways (${hosted.length}):
				
				${hosted.map((giveaway) => giveaway.toFullString()).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				files: [getAttachment(string)]
			});

			viewAllHostedButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows(),
				content: null,
				embeds: [embed]
			});
		}
	});
};

export const getCommand: () => Command = () => ({
	data,
	run
});
