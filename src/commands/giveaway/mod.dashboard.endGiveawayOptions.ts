import { type giveaway } from "@prisma/client";
import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ButtonInteraction,
	type Guild
} from "discord.js";
import type GiveawayManager from "../../database/giveaway.js";
import yesNo from "../../helpers/yesNo.js";
import toDashboard from "./mod.dashboard.js";

export const rollWinners = async (options: {
	customNumberOfWinners?: number;
	giveaway: giveaway;
	guild: Guild;
}) => {
	const { giveaway, customNumberOfWinners, guild } = options;

	// removes duplicates
	const entries: Array<string> = [...new Set(giveaway.userEntriesIds)];

	const requiredRoles = giveaway.requiredRoles;
	const minimumAccountAge = Number(giveaway.minimumAccountAge);
	const numberToRoll = customNumberOfWinners ?? giveaway.numberOfWinners;

	const members = await guild.members.fetch({ force: true });

	const validEntrants = entries.filter((userId) => {
		const member = members.get(userId);

		if (!member) {
			return false;
		}

		if (
			minimumAccountAge &&
			minimumAccountAge <= Date.now() - member.user.createdTimestamp
		) {
			return false;
		}

		if (
			requiredRoles.length &&
			!member.roles.cache.hasAll(...requiredRoles)
		) {
			return false;
		}

		return true;
	});

	const bucket: Set<string> = new Set(validEntrants);
	const pool: Set<string> = new Set();
	let retries = 0;

	for (let i = 0; i < numberToRoll; i++) {
		const winnerId = [...bucket.values()].at(
			Math.floor(Math.random() * bucket.size)
		);

		// this should never happen
		if (!winnerId) {
			retries++;
			i--;

			if (4 < retries) {
				break;
			}

			continue;
		}

		retries = 0;

		pool.add(winnerId);
		bucket.delete(winnerId);
	}

	return [...pool.values()];
};

export const publishWinners = async () => {
	//
};

export default async function toEndGiveawayOptions(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return;
	}

	let content = `Are you sure you want to end giveaway #${giveaway.guildRelativeId}?`;

	if (giveaway.endTimestamp && Number(giveaway.endTimestamp) < Date.now()) {
		content += `\n\nThe giveaway is set to end ${
			Date.now() - Number(giveaway.endTimestamp)
		}`;
	}

	const confirmation = await yesNo({
		filter: (i) => i.user.id === interaction.user.id,
		yesStyle: ButtonStyle.Secondary,
		noStyle: ButtonStyle.Secondary,
		medium: interaction,
		time: 60_000,
		data: {
			components: [],
			content,
			embeds: []
		}
	});

	if (!confirmation) {
		await interaction.followUp({
			content: "Alright! Ending the giveaway was canceled.",
			ephemeral: true
		});

		return toDashboard(interaction, giveawayId);
	}

	const channel = interaction.guild.channels.cache.get(
		giveaway.channelId ?? ""
	);

	const message =
		(channel?.isTextBased() &&
			(await channel.messages
				.fetch(giveaway.messageId ?? "")
				.catch(() => null))) ||
		null;

	await message?.edit({
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("This giveaway has ended!")
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("giveaway-ended")
					.setDisabled(true)
			)
		]
	});

	const winners = await rollWinners({
		giveaway,
		guild: interaction.guild
	});

	await giveawayManager.edit({
		where: {
			giveawayId: giveaway.giveawayId
		},
		data: {
			lockEntries: true,
			active: false,
			winnerUserIds: winners
		}
	});

	const x = await giveawayManager.getWinners(giveawayId);

	if (!x.length) {
		await giveawayManager.createWinners(
			...winners.map((userId) => ({
				giveawayId,
				accepted: false,
				userId
			}))
		);
	}

	const publishWinners = await yesNo({
		filter: (i) => i.user.id === interaction.user.id,
		yesStyle: ButtonStyle.Secondary,
		noStyle: ButtonStyle.Secondary,
		medium: interaction,
		time: 60_000,
		data: {
			components: [],
			embeds: [],
			content: stripIndents`
				Done! Giveaway #${giveaway.guildRelativeId} has ended.
				→ Entries are locked.
				→ Giveaway is no longer active.
				→ ${winners.length}/${giveaway.numberOfWinners} winners have been rolled.

				Do you want to publish the winners right away?
			`
		}
	});

	// await toDashboard(interaction, giveawayId);
}
