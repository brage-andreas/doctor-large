import { type giveaway } from "@prisma/client";
import { oneLine, stripIndents } from "common-tags";
import { EmbedBuilder, PermissionFlagsBits, type Guild } from "discord.js";
import GiveawayManager from "../../database/giveaway.js";
import { listify } from "../../helpers/listify.js";
import { longStamp, timestamp } from "../../helpers/timestamps.js";

async function formatGiveaway(
	data: giveaway,
	embed: true,
	guild?: Guild
): Promise<EmbedBuilder>;
async function formatGiveaway(
	data: giveaway,
	embed: false,
	guild?: Guild
): Promise<string>;
async function formatGiveaway(
	data: giveaway,
	embed: boolean,
	guild?: Guild
): Promise<EmbedBuilder | string> {
	const id = data.guildRelativeId;
	const title = data.giveawayTitle;
	const description = data.giveawayDescription;
	const active = data.active;
	const numberOfWinners = data.numberOfWinners;
	const requiredRoles = data.requiredRoles;
	const rolesToPing = data.rolesToPing;
	const published = Boolean(data.messageId);
	const hostId = data.hostUserId;
	const hostTag = data.hostUserTag;
	const entries = data.userEntriesIds.length;
	const lockEntries = data.lockEntries;
	const created = data.createdTimestamp;
	const editUID = data.lastEditedUserId;
	const editTag = data.lastEditedUserTag;
	const editStamp = data.lastEditedTimestamp;
	const endTimestamp = data.endTimestamp;
	const winners = data.winnerUserIds;

	const prizes = await new GiveawayManager(data.guildId).getPrizes(
		data.giveawayId
	);

	if (embed) {
		const numberOfWinnersStr = `→ Number of winners: ${numberOfWinners}`;

		const requiredRolesStr = requiredRoles.length
			? `→ Roles required to enter: ${listify(
					requiredRoles.map((roleId) => `<@&${roleId}>`),
					{ length: 10 }
			  )}`
			: "→ This giveaway is open for everyone! Woo!";

		const endStr = endTimestamp
			? `→ The giveaway will end: ${longStamp(endTimestamp)}`
			: "→ The giveaway has no set end date. Enter while you can!";

		const prizesStr = prizes.length
			? prizes
					.map(
						(prize) =>
							`${prize.amount}x **${prize.name}** ${
								prize.additionalInfo
									? `- ${prize.additionalInfo}`
									: ""
							}`
					)
					.join("\n")
			: "There are no set prizes. Maybe it is a secret? 🤫";

		const descriptionStr = stripIndents`
			${description}
		
			**Info**
			${numberOfWinnersStr}
			${endStr}
			${requiredRolesStr}

			**Prizes**
			${prizesStr}
		`;

		return new EmbedBuilder()
			.setTitle(title)
			.setDescription(descriptionStr)
			.setColor("#2d7d46")
			.setFooter({
				text: `Giveaway #${id} • Hosted by ${hostTag}`
			});
	}

	const requiredRolesStr = requiredRoles.length
		? `→ Required roles (${requiredRoles.length}): ${listify(
				requiredRoles.map((roleId) => `<@&${roleId}>`),
				{ length: 5 }
		  )}`
		: "→ Required roles: None";

	const pingRolesStr = rolesToPing.length
		? `→ Ping roles (${rolesToPing.length}): ${listify(
				rolesToPing.map((roleId) => `<@&${roleId}>`),
				{ length: 10 }
		  )}`
		: "→ Ping roles: None";

	const badPingRoles = rolesToPing.filter((roleId) => {
		const mentionable = guild?.roles.cache.get(roleId)?.mentionable;
		const hasPerms = guild?.members.me?.permissions.has(
			PermissionFlagsBits.MentionEveryone
		);

		return !mentionable && !hasPerms;
	});

	const pingRolesWarning = badPingRoles.length
		? oneLine`
			⚠️ Missing permissions to ping roles (${badPingRoles.length}):
			${listify(
				badPingRoles.map((roleId) => `<@&${roleId}>`),
				{ length: 10 }
			)}
		`
		: null;

	const endStr = endTimestamp
		? `→ End date: ${longStamp(endTimestamp)}`
		: "→ End date: ⚠️ The giveaway has no set end date. It will be open indefinitely!";

	const prizesStr = prizes.length
		? `**Prizes** (${prizes.length}):\n${prizes
				.map(
					(prize) =>
						`→ ${prize.amount}x ${prize.name} ${
							prize.additionalInfo
								? `- ${prize.additionalInfo}`
								: ""
						}`
				)
				.join("\n")}`
		: "**Prizes**: ⚠️ There are no set prizes";

	const titleStr = `**Title**:\n\`\`\`\n${title}\n\`\`\``;

	const descriptionStr = `**Description**:\n${
		description
			? `\`\`\`\n${description}\n\`\`\``
			: "⚠️ There is no set description"
	}`;

	const idStr = `#${id}`;
	const absoluteIdStr = `#${data.giveawayId}`;
	const numberOfWinnersStr = `→ Number of winners: ${numberOfWinners}`;
	const hostStr = `→ Host: ${hostTag} (${hostId})`;
	const activeStr = `→ Active: ${active ? "Yes" : "No"}`;
	const publishedStr = `→ Published: ${published ? "Yes" : "No"}`;
	const entriesStr = `→ Entries: ${entries}`;
	const createdStr = `→ Created: ${longStamp(created)}`;
	const lockEntriesStr = `→ Entries locked: ${lockEntries ? "Yes" : "No"}`;
	const messageUrl =
		data.guildId && data.channelId && data.messageId
			? `\n→ [Link to giveaway](<https://discord.com/channels/${data.guildId}/${data.channelId}/${data.messageId}>)`
			: "";

	const winnersStr = winners.length
		? `→ Winners (${winners.length}): ${winners
				.map((id) => `<@${id}> (${id})`)
				.join(", ")}`
		: "→ No winners (yet)";

	const lastEditStr =
		!editTag && !editUID && !editStamp
			? "No edits"
			: oneLine`
				Last edited by:
				${editTag ?? "Unknown tag"}
				(${editUID ?? "Unknown ID"})
				${editStamp ? timestamp(editStamp, "R") : "Unknown date"}
			`;

	return stripIndents`
		${titleStr}
		${descriptionStr}
		${prizesStr}

		**Info**:
		${hostStr}
		${createdStr}
		${entriesStr}
		${winnersStr}${messageUrl}
		
		**Options**:
		${endStr}
		${activeStr}
		${publishedStr}
		${lockEntriesStr}
		${numberOfWinnersStr}
		${requiredRolesStr}
		${pingRolesStr} ${pingRolesWarning ? `\n\n${pingRolesWarning}` : ""}

		Giveaway ${idStr} (${absoluteIdStr}) • ${lastEditStr}
	`;
}

export default formatGiveaway;
