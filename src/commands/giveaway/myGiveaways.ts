/* eslint-disable no-irregular-whitespace */
import { source, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	AttachmentBuilder,
	ComponentType,
	EmbedBuilder,
	type ButtonBuilder,
	type ButtonInteraction,
	type EmbedField,
	type RESTPostAPIApplicationCommandsJSONBody
} from "discord.js";
import components from "../../components/index.js";
import { COLORS, EMOJIS, MY_GIVEAWAYS_MAX_PRIZES } from "../../constants.js";
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

const run = async (
	interaction: ButtonInteraction | CommandModuleInteractions
) => {
	if (!interaction.isChatInputCommand()) {
		return;
	}

	const hide = interaction.options.getBoolean("hide") ?? true;

	if (!interaction.isButton()) {
		await interaction.deferReply({ ephemeral: hide });
	}

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

			map.set(g.guildRelativeId, {
				claimed: old.claimed.concat([...prizes.claimed.values()]),
				unclaimed: old.unclaimed.concat([...prizes.unclaimed.values()])
			});

			const claimedSize = [...prizes.claimed.values()].reduce(
				(acc, e) => acc + e.count,
				0
			);

			const unclaimedSize = [...prizes.unclaimed.values()].reduce(
				(acc, e) => acc + e.count,
				0
			);

			prizeCount.all += claimedSize + unclaimedSize;
			prizeCount.claimed += claimedSize;
			prizeCount.unclaimed += unclaimedSize;

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

	const { acceptAllPrizes, viewAllEntered, viewAllPrizes, viewAllHosted } =
		components.buttons;

	const acceptAllPrizesButton = prizeCount.unclaimed
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

	const prizesArr = (noLimits?: true): Array<EmbedField> =>
		[...prizes.entries()].map(([id, { claimed, unclaimed }]) => {
			const max = MY_GIVEAWAYS_MAX_PRIZES;
			let n = 0;

			const arr = [...unclaimed, ...claimed].map((p) => {
				const { name } = p.prize;
				const claim = p.winner.claimed;

				n += p.count;

				return `→ ${p.count}x ${name}${!claim ? " (UNCLAIMED)" : ""}`;
			});

			if (noLimits) {
				return {
					name: `Giveaway #${id} (${n})`,
					value: arr.join("\n"),
					inline: true
				};
			}

			return {
				name: `Giveaway #${id} (${n})`,
				value: stripIndents`
					${arr.slice(0, max).join("\n")}
					${max < arr.length ? `... and ${arr.length - max} more` : ""}
				`,
				inline: true
			};
		});

	const MAX_LEN = 3900; // arbitrary - must be 4096 or under but there are also fields;
	const fields: Array<EmbedField> = [];

	for (const field of prizesArr()) {
		const fieldTotalLen = fields.reduce(
			(acc, e) => acc + e.name.length + e.value.length,
			0
		);

		if (MAX_LEN <= fieldTotalLen + field.name.length + field.value.length) {
			break;
		}

		fields.push(field);
	}

	const embed = new EmbedBuilder()
		.setColor(prizeCount.unclaimed ? COLORS.YELLOW : COLORS.GREEN)
		.setTitle("My Giveaways")
		.setFields(
			{
				name: "Stats",
				value: source`
					Entered: ${entered.length}
					​    └─ Won: ${winCount}
					Hosted: ${hosted.length}
					Prizes: ${prizeCount.all}
					​	 ├─ Claimed: ${prizeCount.claimed}
					​	 └─ Unclaimed: ${prizeCount.unclaimed}
				`
			},
			...fields
		);

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

		if (buttonInteraction.customId === acceptAllPrizes.customId) {
			const unclaimed = [...prizes.values()].flatMap((p) => p.unclaimed);

			let n = 0;

			for (; n < unclaimed.length; n++) {
				const obj = unclaimed[n];

				await giveawayManager.setWinnerClaimed({
					claimed: true,
					prizeId: obj.prize.id,
					userId: interaction.user.id
				});
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

			return run(buttonInteraction);
		}

		const getAttachment = (string: string) => {
			const { createdAt, user, guild } = buttonInteraction;

			// +8 is for the "User: .." prefix
			const text = source`
				> ${createdAt.toUTCString()}
				> Server: ${guild.name} (${guild.id})
				> User: ${user.tag} (${user.id})
				  
				${string}
			`;

			return new AttachmentBuilder(Buffer.from(text), {
				name: `giveaways_${guild.id}_${user.id}.txt`
			});
		};

		if (buttonInteraction.customId === viewAllEntered.customId) {
			const title = `Entered giveaways (${entered.length})`;
			const sep = "-".repeat(title.length + 2);

			const string = source`
				-${sep}-
				| ${title} |
				-${sep}-

				${entered.map((g) => g.toFullString({ userId: id })).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				ephemeral: true,
				files: [getAttachment(string)]
			});

			viewAllEnteredButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows()
			});
		}

		if (buttonInteraction.customId === viewAllPrizes.customId) {
			const title = `Won prizes (${prizeCount.all})`;
			const tally = `${prizeCount.claimed} claimed`;
			const tally2 = `${prizeCount.unclaimed} unclaimed`;

			const max = Math.max(title.length, tally.length, tally2.length);
			const pad = (string: string) => string.padEnd(max, " ");

			const sep = "-".repeat(max + 2);

			const mapFn = (e: EmbedField) =>
				source`
					${e.name}
					  ${e.value}
				`;

			const string = source`
				-${sep}-
				| ${pad(title)} |
				| ${pad(tally)} |
				| ${pad(tally2)} |
				-${sep}-
				
				${prizesArr(true).map(mapFn).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				ephemeral: true,
				files: [getAttachment(string)]
			});

			viewAllPrizesButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows()
			});
		}

		if (buttonInteraction.customId === viewAllHosted.customId) {
			const title = `Entered giveaways (${entered.length})`;
			const sep = "-".repeat(title.length + 2);

			const string = source`
				-${sep}-
				| ${title} |
				-${sep}-
				
				${hosted.map((g) => g.toFullString()).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				ephemeral: true,
				files: [getAttachment(string)]
			});

			viewAllHostedButton?.setDisabled(true);

			await interaction.editReply({
				components: getRows()
			});
		}
	});
};

export const getCommand: () => Command = () => ({
	data,
	run
});
