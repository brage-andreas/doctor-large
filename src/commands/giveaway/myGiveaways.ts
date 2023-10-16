/* eslint-disable no-irregular-whitespace */
import {
	type APIButtonComponentWithCustomId,
	ApplicationCommandType,
	AttachmentBuilder,
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
	type EmbedField,
	PermissionFlagsBits,
	type User,
	type UserContextMenuCommandInteraction,
} from "discord.js";
import { type CommandData, type CommandExport, type CountPrizeWinner, type GiveawayId } from "#typings";
import { Colors, Emojis, HIDE_OPTION, MY_GIVEAWAYS_MAX_PRIZES } from "#constants";
import { oneLine, source, stripIndents } from "common-tags";
import GiveawayManager from "#database/giveaway.js";
import components from "#components";
import { getTag } from "#helpers";
import Logger from "#logger";

const data: CommandData = {
	chatInput: {
		description: "View all the giveaways you have participated in.",
		dm_permission: false,
		name: "my-giveaways",
		options: [HIDE_OPTION],
	},
	contextMenu: {
		default_member_permissions: PermissionFlagsBits.ManageGuild.toString(),
		dm_permission: false,
		name: "Show giveaways",
		type: ApplicationCommandType.User,
	},
};

const run = async (
	interaction:
		| ButtonInteraction<"cached">
		| ChatInputCommandInteraction<"cached">
		| UserContextMenuCommandInteraction<"cached">,
	target: User
) => {
	const isAuthor = target.id === interaction.user.id;
	const tag = getTag(target);

	const logger = new Logger({ interaction, label: "MY GIVEAWAYS" });

	const giveawayManager = new GiveawayManager(interaction.guild);

	const { id } = target;

	const entered = await giveawayManager.getAll({ entryUserId: id });
	const hosted = await giveawayManager.getAll({ hostUserId: id });

	if (entered.length === 0 && hosted.length === 0) {
		await interaction
			.editReply({
				content: oneLine`
					${Emojis.NoEntry}
					${isAuthor ? "You have" : `${tag} has`}
					not participated in any giveaways yet!
				`,
			})
			.catch(() => null);

		return;
	}

	let winCount = 0;

	const prizeCount = {
		all: 0,
		claimed: 0,
		unclaimed: 0,
	};

	const prizes = entered.reduce(
		(map, g) => {
			const prizes = g.prizesOf(id);

			if (!prizes?.claimed.size && !prizes?.unclaimed.size) {
				return map;
			}

			const old = map.get(g.guildRelativeId) ?? {
				claimed: [],
				unclaimed: [],
			};

			map.set(g.guildRelativeId, {
				claimed: [...old.claimed, ...prizes.claimed.values()],
				unclaimed: [...old.unclaimed, ...prizes.unclaimed.values()],
			});

			const claimedSize = [...prizes.claimed.values()].reduce(
				(accumulator, prize) => accumulator + prize.count,
				0
			);

			const unclaimedSize = [...prizes.unclaimed.values()].reduce(
				(accumulator, prize) => accumulator + prize.count,
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
				claimed: Array<CountPrizeWinner>;
				unclaimed: Array<CountPrizeWinner>;
			}
		>()
	);

	const { acceptAllPrizes, viewAllEntered, viewAllHosted, viewAllPrizes } = components.buttons;

	const acceptAllPrizesButton = prizeCount.unclaimed && isAuthor ? acceptAllPrizes.component() : null;

	const viewAllEnteredButton = entered.length > 0 ? viewAllEntered.component() : null;

	const viewAllPrizesButton = prizes.size > 0 ? viewAllPrizes.component() : null;

	const viewAllHostedButton = hosted.length > 0 ? viewAllHosted.component() : null;

	const getButtonArray = () =>
		[acceptAllPrizesButton, viewAllEnteredButton, viewAllPrizesButton, viewAllHostedButton].filter(
			(buttonOrNull) => buttonOrNull !== null
		) as Array<APIButtonComponentWithCustomId>;

	const getRows = () => {
		const buttons = getButtonArray();

		return buttons.length > 0 ? components.createRows(...buttons) : [];
	};

	const prizesArray = (noLimits?: true): Array<EmbedField> =>
		[...prizes.entries()].map(([id, { claimed, unclaimed }]) => {
			const max = MY_GIVEAWAYS_MAX_PRIZES;
			let n = 0;

			const array = [...unclaimed, ...claimed].map((p) => {
				const { name } = p.prize;
				const claim = p.winner.claimed;

				n += p.count;

				return `* ${p.count}x ${name}${claim ? "" : " (UNCLAIMED)"}`;
			});

			if (noLimits) {
				return {
					inline: true,
					name: `Prizes of giveaway #${id} (${n})`,
					value: array.join("\n"),
				};
			}

			return {
				inline: true,
				name: `Giveaway #${id} (${n})`,
				value: stripIndents`
					${array.slice(0, max).join("\n")}
					${max < array.length ? `... and ${array.length - max} more` : ""}
				`,
			};
		});

	const MAX_TOTAL_FIELD_LEN = 3900; // arbitrary - must be 4096 or under;
	const fields: Array<EmbedField> = [];

	for (const field of prizesArray()) {
		const fieldTotalLength = fields.reduce(
			(accumulator, field) => accumulator + field.name.length + field.value.length,
			0
		);

		if (MAX_TOTAL_FIELD_LEN <= fieldTotalLength + field.name.length + field.value.length) {
			break;
		}

		fields.push(field);
	}

	const embed = new EmbedBuilder()
		.setColor(prizeCount.unclaimed ? Colors.Yellow : Colors.Green)
		.setTitle(`${tag}'s giveaways`)
		.setFields(
			{
				name: "Stats",
				value: stripIndents`
					Entered: ${entered.length}
					Won: ${winCount}${hosted.length > 0 ? `\nHosted: ${hosted.length}` : ""}
					Prizes: ${prizeCount.all} ${prizeCount.unclaimed ? `(${prizeCount.unclaimed} unclaimed!)` : ""}
				`,
			},
			...fields
		);

	const rows = getRows();

	const message = await interaction.editReply({
		components: rows,
		content: null,
		embeds: [embed],
	});

	logger.log(`Sent overview of ${tag} (${id})`);

	if (rows.length === 0) {
		return;
	}

	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
		// One more since accepting all prizes will let you see prizes again
		max: getButtonArray().length + 1,
		// If there are 2 buttons, 3 will be max
		// If there are 3 buttons, 4 will be max etc.
		time: 120_000,
	});

	collector.on("ignore", (buttonInteraction) => {
		buttonInteraction
			.reply({
				content: `${Emojis.NoEntry} This button is not for you.`,
				ephemeral: true,
			})
			.catch(() => null);
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
			if (!isAuthor) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				acceptAllPrizesButton!.disabled = true;

				await interaction.followUp({
					content: `${Emojis.Error} You cannot do this action.`,
					ephemeral: true,
				});

				await interaction.editReply({
					components: getRows(),
				});
			}

			const unclaimed = [...prizes.values()].flatMap((p) => p.unclaimed);

			let n = 0;

			for (; n < unclaimed.length; n++) {
				const object = unclaimed[n];

				await giveawayManager.setWinnerClaimed({
					claimed: true,
					prizeId: object.prize.id,
					userId: interaction.user.id,
				});
			}

			logger.log(`Bulk-accepted ${n} prize(s): ${unclaimed.map((p) => p.prize.id).join(", ")}`);

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			acceptAllPrizesButton!.disabled = true;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			viewAllPrizesButton!.disabled = false;

			await buttonInteraction.followUp({
				content: `${Emojis.Sparks} Accepted all prizes!`,
				ephemeral: true,
			});

			collector.stop();

			void run(buttonInteraction, target);

			return;
		}

		const getAttachment = (string: string) => {
			const { createdAt, guild } = buttonInteraction;

			// +8 is for the "User: .." prefix
			const text = source`
				> ${createdAt.toUTCString()}
				> Server: ${guild.name} (${guild.id})
				> User: ${target.tag} (${id})
				  
				${string}
			`;

			return new AttachmentBuilder(Buffer.from(text), {
				name: `giveaways_${guild.id}_${id}.txt`,
			});
		};

		if (buttonInteraction.customId === viewAllEntered.customId) {
			const title = `Entered giveaways (${entered.length})`;
			const separator = "-".repeat(title.length + 2);

			const string = source`
				-${separator}-
				| ${title} |
				-${separator}-

				${entered.map((g) => g.toFullString({ userId: id })).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				ephemeral: true,
				files: [getAttachment(string)],
			});

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			viewAllEnteredButton!.disabled = true;

			await interaction.editReply({
				components: getRows(),
			});
		}

		if (buttonInteraction.customId === viewAllPrizes.customId) {
			const title = `Won prizes (${prizeCount.all})`;
			const tally = `${prizeCount.claimed} claimed`;
			const tally2 = `${prizeCount.unclaimed} unclaimed`;

			const max = Math.max(title.length, tally.length, tally2.length);
			const pad = (string: string) => string.padEnd(max, " ");

			const separator = "-".repeat(max + 2);

			const mapFunction = (field: EmbedField) =>
				source`
					${field.name}
					  ${field.value}
				`;

			const string = source`
				-${separator}-
				| ${pad(title)} |
				| ${pad(tally)} |
				| ${pad(tally2)} |
				-${separator}-
				
				${prizesArray(true)
					.map((field) => mapFunction(field))
					.join("\n\n")}
			`;

			await buttonInteraction.followUp({
				ephemeral: true,
				files: [getAttachment(string)],
			});

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			viewAllPrizesButton!.disabled = true;

			await interaction.editReply({
				components: getRows(),
			});
		}

		if (buttonInteraction.customId === viewAllHosted.customId) {
			const title = `Entered giveaways (${entered.length})`;
			const separator = "-".repeat(title.length + 2);

			const string = source`
				-${separator}-
				| ${title} |
				-${separator}-
				
				${hosted.map((g) => g.toFullString()).join("\n\n")}
			`;

			await buttonInteraction.followUp({
				ephemeral: true,
				files: [getAttachment(string)],
			});

			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			viewAllHostedButton!.disabled = true;

			await interaction.editReply({
				components: getRows(),
			});
		}
	});
};

const chatInput = async (interaction: ChatInputCommandInteraction<"cached">) => {
	const hide = interaction.options.getBoolean("hide") ?? true;

	await interaction.deferReply({ ephemeral: hide });

	await run(interaction, interaction.user);
};

const contextMenu = async (interaction: UserContextMenuCommandInteraction<"cached">) => {
	await interaction.deferReply({ ephemeral: true });

	await run(interaction, interaction.targetUser);
};

export const getCommand: CommandExport = () => ({
	data,
	handle: {
		chatInput,
		contextMenu,
	},
});
