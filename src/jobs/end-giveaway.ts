import { rollAndSign } from "../commands/giveaway/giveaway-modules/end-modules/roll-winners/roll-and-sign.js";
import { type GiveawayWithIncludes, type WinnerId } from "#typings";
import GiveawayModule from "#modules/giveaway.js";
import { longstamp, messageURL } from "#helpers";
import { type Client, bold } from "discord.js";
import { Emojis, Giveaway } from "#constants";
import { oneLine, source } from "common-tags";
import prisma from "#database/prisma.js";
import components from "#components";

const DM_BUFFER = Giveaway.HostDMTimeBeforeEnd;

export default async function checkEndingGiveawaysFunction(client: Client<true>) {
	const now = Date.now();
	const nowWithBuffer = now + DM_BUFFER;

	const lteNoBuffer = new Date(now).toISOString();
	const lteWithBuffer = new Date(nowWithBuffer).toISOString();

	const all = await prisma.giveaway.findMany({
		include: {
			prizes: {
				include: {
					winners: true,
				},
			},
		},
		where: {
			AND: {
				ended: false,
			},
			OR: [
				{
					endDate: { lte: lteNoBuffer },
					hostNotified: { not: "OnEnd" },
				},
				{
					endDate: { lte: lteWithBuffer },
					hostNotified: "None",
				},
			],
		},
	});

	const [toEnd, toNotify] = all.reduce<
		[Array<GiveawayWithIncludes & { endDate: Date }>, Array<GiveawayWithIncludes & { endDate: Date }>]
	>(
		([toEnd, toNotifyBefore], giveaway) => {
			const { endDate } = giveaway;

			// Should never be null based on the query
			if (!endDate) {
				return [toEnd, toNotifyBefore];
			}

			const typeGuardedGiveaway = giveaway as GiveawayWithIncludes & {
				endDate: Date;
			};

			const hasEnded = endDate.getTime() <= now;

			const withinBuffer =
				typeGuardedGiveaway.hostNotified === "None" &&
				nowWithBuffer * 0.8 <= endDate.getTime() &&
				endDate.getTime() <= nowWithBuffer;

			if (hasEnded) {
				toEnd.push(typeGuardedGiveaway);
			} else if (withinBuffer) {
				toNotifyBefore.push(typeGuardedGiveaway);
			}

			return [toEnd, toNotifyBefore];
		},
		[[], []]
	);

	for (const giveaway of toNotify) {
		const {
			announcementMessageId,
			channelId,
			endAutomation,
			endDate,
			guildId,
			guildRelativeId,
			hostUserId,
			id,
			title,
		} = giveaway;

		const guildName = client.guilds.cache.get(guildId)?.name ?? "unknown server";

		const url = channelId && announcementMessageId ? messageURL(guildId, channelId, announcementMessageId) : null;

		const timeLeft = longstamp(endDate);

		const string = source`
			${bold("A giveaway you are hosting is about to end!")} ${Emojis.Sparks}
			* ${title} • #${guildRelativeId} • ${guildName}

			It will end ${timeLeft}.

			End automation is set to: ${bold(endAutomation)}
		`;

		const rows = url
			? components.createRows(components.buttons.url({ label: "Go to giveaway", url }).component())
			: undefined;

		client.users.send(hostUserId, { components: rows, content: string }).catch(() => null);

		if (endAutomation === "None") {
			return;
		}

		await prisma.giveaway.update({
			data: {
				hostNotified: "BeforeEnd",
			},
			where: {
				id,
			},
		});
	}

	/* ----------------- */

	for (const giveaway of toEnd) {
		const {
			announcementMessageId,
			channelId,
			endAutomation,
			entriesUserIds,
			guildId,
			guildRelativeId: giveawayRId,
			hostUserId,
			id: giveawayId,
			title,
		} = giveaway;

		const guild = client.guilds.cache.get(guildId);
		const guildName = guild?.name ?? "unknown server";

		const channel_ = channelId ? guild?.channels.cache.get(channelId) : null;

		const channel = channel_?.isTextBased() ? channel_ : null;

		const url = channelId && announcementMessageId ? messageURL(guildId, channelId, announcementMessageId) : null;

		const string = source`
			${bold("A giveaway you are hosting just ended!")} ${Emojis.Sparks}.
			* ${title} • #${giveawayRId} • ${guildName}.

			End automation was set to: ${bold(endAutomation)}.

			How to see winners:
			1. Go to ${guildName}.
			2. Open the dashboard of giveaway #${giveawayRId}.
			3. Click the "Show all winners" button.

			The winners have to manually claim their prizes.
			If a winner does not respond, you can re-roll unclaimed prizes.

			The winners can claim their prizes using:
			* The /my-giveaways command.
			* The "${Emojis.StarEyes} Accept Prize" button in the announcement.

			GG!
		`;

		const rows = url
			? components.createRows(components.buttons.url({ label: "Go to giveaway", url }).component())
			: undefined;

		client.users.send(hostUserId, { components: rows, content: string }).catch(() => null);

		if (endAutomation === "None") {
			await prisma.giveaway.update({
				data: {
					hostNotified: "OnEnd",
				},
				where: {
					id: giveawayId,
				},
			});

			return;
		}

		await prisma.giveaway.update({
			data: {
				ended: true,
				entriesLocked: true,
				hostNotified: "OnEnd",
			},
			where: {
				id: giveawayId,
			},
		});

		if ((endAutomation !== "Roll" && endAutomation !== "Announce") || !guild) {
			continue;
		}

		const module = new GiveawayModule(giveaway, guild);

		// TODO: set `notified` to true
		const winnerBucket = await rollAndSign({
			entries: entriesUserIds,
			giveaway: module,
			ignoreRequirements: false,
			overrideClaimed: false,
			prizes: module.prizes,
			prizesQuantity: module.prizesQuantity(),
			winnerQuantity: module.winnerQuantity,
		});

		if (endAutomation === "Announce") {
			await module.winnerMessage?.delete();

			const rows = components.createRows(components.buttons.acceptPrize(giveawayId));

			const message = await (announcementMessageId
				? module.announcementMessage
						?.reply({
							...module.endedEmbed(),
							components: rows,
						})
						.catch(() => null)
				: channel
						?.send({
							...module.endedEmbed(),
							components: rows,
						})
						.catch(() => null));

			if (message) {
				await prisma.giveaway.update({
					data: {
						winnerMessageId: message.id,
						winnerMessageUpdated: true,
					},
					where: {
						id: giveawayId,
					},
				});
			} else {
				const message_ = oneLine`
					${Emojis.Error} Failed to automatically announce winners for
					#${giveawayRId} in ${guild.name}.
				`;

				client.users.send(hostUserId, message_).catch(() => null);
			}

			const ids: Array<WinnerId> = [];

			if (winnerBucket) {
				await module.dmWinners({
					includeNotified: false,
					winners: winnerBucket,
				});

				await module.manager.prisma.winner.updateMany({
					data: {
						notified: true,
					},
					where: {
						id: { in: ids },
					},
				});
			}
		}
	}
}
