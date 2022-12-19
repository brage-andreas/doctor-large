import { oneLine, stripIndents } from "common-tags";
import { EmbedBuilder, PermissionFlagsBits, type Guild } from "discord.js";
import ms from "ms";
import { listify } from "../../helpers/listify.js";
import { longStamp, timestamp } from "../../helpers/timestamps.js";
import { type CompleteGiveaway } from "../../typings/database.js";

function formatGiveaway(
	giveaway: CompleteGiveaway,
	embed: true,
	guild?: Guild
): EmbedBuilder;
function formatGiveaway(
	giveaway: CompleteGiveaway,
	embed: false,
	guild?: Guild
): string;
function formatGiveaway(
	giveaway: CompleteGiveaway,
	embed: boolean,
	guild?: Guild
): EmbedBuilder | string {
	const id = giveaway.guildRelativeId;
	const title = giveaway.giveawayTitle;
	const description = giveaway.giveawayDescription;
	const active = giveaway.active;
	const numberOfWinners = giveaway.numberOfWinners;
	const requiredRoles = giveaway.requiredRoles;
	const minimumAccountAge = giveaway.minimumAccountAge;
	const rolesToPing = giveaway.rolesToPing;
	const published = Boolean(giveaway.messageId);
	const hostId = giveaway.hostUserId;
	const hostTag = giveaway.hostUserTag;
	const entries = giveaway.userEntriesIds.length;
	const lockEntries = giveaway.lockEntries;
	const created = giveaway.createdTimestamp;
	const editUID = giveaway.lastEditedUserId;
	const editTag = giveaway.lastEditedUserTag;
	const editStamp = giveaway.lastEditedTimestamp;
	const endTimestamp = giveaway.endTimestamp;
	const winners = giveaway.prizes
		.map((prize) => prize.winner)
		.filter((e) => Boolean(e));

	if (embed) {
		const numberOfWinnersStr = `→ Number of winners: ${numberOfWinners}`;

		const requiredRolesStr = `→ Roles required to enter: ${
			requiredRoles.length
				? listify(
						requiredRoles.map((roleId) => `<@&${roleId}>`),
						{ length: 10 }
				  )
				: "None"
		}`;

		const minimumAccountAgeStr = `→ Minimum account age: ${
			minimumAccountAge
				? ms(Number(minimumAccountAge), { long: true })
				: "None"
		}`;

		const endStr = endTimestamp
			? `→ The giveaway will end: ${longStamp(endTimestamp)}`
			: "→ The giveaway has no set end date. Enter while you can!";

		const prizesStr = giveaway.prizes.length
			? giveaway.prizes
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
			${minimumAccountAgeStr}

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

	const minimumAccountAgeStr = `→ Minimum account age: ${
		minimumAccountAge
			? ms(Number(minimumAccountAge), { long: true })
			: "None"
	}`;

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

	const prizesStr = giveaway.prizes.length
		? `**Prizes** (${giveaway.prizes.length}):\n${giveaway.prizes
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
	const absoluteIdStr = `#${giveaway.giveawayId}`;
	const numberOfWinnersStr = `→ Number of winners: ${numberOfWinners}`;
	const hostStr = `→ Host: ${hostTag} (${hostId})`;
	const activeStr = `→ Active: ${active ? "Yes" : "No"}`;
	const publishedStr = `→ Published: ${published ? "Yes" : "No"}`;
	const entriesStr = `→ Entries: ${entries}`;
	const createdStr = `→ Created: ${longStamp(created)}`;
	const lockEntriesStr = `→ Entries locked: ${lockEntries ? "Yes" : "No"}`;
	const messageUrl =
		giveaway.guildId && giveaway.channelId && giveaway.messageId
			? `→ [Link to giveaway](<https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId}>)`
			: null;

	const winnersStr = winners.length
		? `→ Winners (${winners.length}): ${winners
				.map((id) => `<@${id}> (${id})`)
				.join(", ")}`
		: "→ No winners";

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
		${winnersStr}${messageUrl ? `\n${messageUrl}` : ""}
		
		**Options**:
		${endStr}
		${activeStr}
		${publishedStr}
		${lockEntriesStr}
		${numberOfWinnersStr}
		${minimumAccountAgeStr}
		${requiredRolesStr}
		${pingRolesStr} ${pingRolesWarning ? `\n\n${pingRolesWarning}` : ""}

		Giveaway ${idStr} (${absoluteIdStr}) • ${lastEditStr}
	`;
}

export default formatGiveaway;
