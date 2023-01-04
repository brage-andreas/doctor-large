import { oneLine, stripIndents } from "common-tags";
import { EmbedBuilder, PermissionFlagsBits, type Guild } from "discord.js";
import ms from "ms";
import { EMOJIS } from "../constants.js";
import { type GiveawayWithIncludes } from "../typings/database.js";
import { listify } from "./listify.js";
import { longStamp, timestamp } from "./timestamps.js";

function formatGiveaway(
	giveaway: GiveawayWithIncludes,
	embed: true,
	guild?: Guild
): EmbedBuilder;
function formatGiveaway(
	giveaway: GiveawayWithIncludes,
	embed: false,
	guild?: Guild
): string;
function formatGiveaway(
	giveaway: GiveawayWithIncludes,
	embed: boolean,
	guild?: Guild
): EmbedBuilder | string {
	const id = giveaway.guildRelativeId;
	const title = giveaway.title;
	const description = giveaway.description;
	const active = giveaway.active;
	const winnerQuantity = giveaway.winnerQuantity;
	const requiredRolesIds = giveaway.requiredRolesIds;
	const minimumAccountAge = giveaway.minimumAccountAge;
	const rolesToPing = giveaway.pingRolesIds;
	const published = Boolean(giveaway.publishedMessageId);
	const hostId = giveaway.hostUserId;
	const hostTag = giveaway.hostUserTag;
	const entries = giveaway.entriesUserIds.length;
	const lockEntries = giveaway.entriesLocked;
	const created = giveaway.createdTimestamp;
	const editUID = giveaway.lastEditedUserId;
	const editTag = giveaway.lastEditedUserTag;
	const editStamp = giveaway.lastEditedTimestamp;
	const endTimestamp = giveaway.endTimestamp;
	const winners = [
		...giveaway.prizes.reduce((pool, prize) => {
			prize.winners.forEach((id) => pool.add(id.userId));

			return pool;
		}, new Set<string>())
	];

	if (embed) {
		const winnerQuantityStr = `→ Number of winners: ${winnerQuantity}`;

		const requiredRolesStr = `→ Roles required to enter: ${
			requiredRolesIds.length
				? listify(
						requiredRolesIds.map((roleId) => `<@&${roleId}>`),
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
							`${prize.quantity}x **${prize.name}** ${
								prize.additionalInfo
									? `- ${prize.additionalInfo}`
									: ""
							}`
					)
					.join("\n")
			: `There are no set prizes. Maybe it is a secret? ${EMOJIS.SHUSH}`;

		const descriptionStr = stripIndents`
			${description}
		
			**Info**
			${winnerQuantityStr}
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

	const requiredRolesStr = requiredRolesIds.length
		? `→ Required roles (${requiredRolesIds.length}): ${listify(
				requiredRolesIds.map((roleId) => `<@&${roleId}>`),
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
			${EMOJIS.WARN} Missing permissions to ping roles (${badPingRoles.length}):
			${listify(
				badPingRoles.map((roleId) => `<@&${roleId}>`),
				{ length: 10 }
			)}
		`
		: null;

	const endStr = endTimestamp
		? `→ End date: ${longStamp(endTimestamp)}`
		: `→ End date: ${EMOJIS.WARN} The giveaway has no set end date. It will be open indefinitely!`;

	const prizesStr = giveaway.prizes.length
		? `**Prizes** (${giveaway.prizes.length}):\n${giveaway.prizes
				.map(
					(prize) =>
						`→ ${prize.quantity}x ${prize.name} ${
							prize.additionalInfo
								? `- ${prize.additionalInfo}`
								: ""
						}`
				)
				.join("\n")}`
		: `**Prizes**: ${EMOJIS.WARN} There are no set prizes`;

	const titleStr = `**Title**:\n\`\`\`\n${title}\n\`\`\``;

	const descriptionStr = `**Description**:\n${
		description
			? `\`\`\`\n${description}\n\`\`\``
			: `${EMOJIS.WARN} There is no set description`
	}`;

	const idStr = `#${id}`;
	const absoluteIdStr = `#${giveaway.id}`;
	const numberOfWinnersStr = `→ Number of winners: ${winnerQuantity}`;
	const hostStr = `→ Host: ${hostTag} (${hostId})`;
	const activeStr = `→ Active: ${active ? "Yes" : "No"}`;
	const publishedStr = `→ Published: ${published ? "Yes" : "No"}`;
	const entriesStr = `→ Entries: ${entries}`;
	const createdStr = `→ Created: ${longStamp(created)}`;
	const lockEntriesStr = `→ Entries locked: ${lockEntries ? "Yes" : "No"}`;

	const gId = giveaway.guildId;
	const cId = giveaway.channelId;
	const mId = giveaway.publishedMessageId;
	const messageUrl =
		giveaway.guildId && giveaway.channelId && giveaway.publishedMessageId
			? `→ [Link to giveaway](<https://discord.com/channels/${gId}/${cId}/${mId}>)`
			: null;

	const winnersStr = winners.length
		? `→ Winners (${winners.length}/${winnerQuantity}): ${winners
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
