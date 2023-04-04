import components from "#components";
import { Emojis, Giveaway } from "#constants";
import prisma from "#database/prisma.js";
import { messageURL } from "#helpers/messageHelpers.js";
import { longstamp } from "#helpers/timestamps.js";
import GiveawayModule from "#modules/Giveaway.js";
import { type GiveawayWithIncludes, type WinnerId } from "#typings";
import { oneLine, source } from "common-tags";
import { bold, type Client, type Message } from "discord.js";
import { rollAndSign } from "../commands/giveaway/giveawayModules/endModules/rollWinners/rollAndSign.js";

const DM_BUFFER = Giveaway.HostDMTimeBeforeEnd;

export default async function checkEndingGiveawaysFn(client: Client<true>) {
	/* ----------------- */
	/* --- Giveaways --- */
	/* ----------------- */

	const now = Date.now();
	const nowWithBuffer = now + DM_BUFFER;

	const lteNoBuffer = new Date(now).toISOString();
	const lteWithBuffer = new Date(nowWithBuffer).toISOString();

	const all = await prisma.giveaway.findMany({
		where: {
			AND: {
				ended: false
			},
			OR: [
				{
					hostNotified: { not: "OnEnd" },
					endDate: { lte: lteNoBuffer }
				},
				{
					hostNotified: "None",
					endDate: { lte: lteWithBuffer }
				}
			]
		},
		include: {
			prizes: {
				include: {
					winners: true
				}
			}
		}
	});

	const [toEnd, toNotify] = all.reduce(
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
		[[], []] as [
			Array<GiveawayWithIncludes & { endDate: Date }>,
			Array<GiveawayWithIncludes & { endDate: Date }>
		]
	);

	for (const giveaway of toNotify) {
		const {
			channelId,
			endAutomation,
			endDate,
			guildId,
			guildRelativeId,
			hostUserId,
			announcementMessageId,
			title
		} = giveaway;

		const guildName =
			client.guilds.cache.get(guildId)?.name ?? "unknown server";

		const url =
			channelId && announcementMessageId
				? messageURL(guildId, channelId, announcementMessageId)
				: null;

		const timeLeft = longstamp(endDate);

		const string = source`
			${bold("A giveaway you are hosting is about to end!")} ${Emojis.Sparks}
			  → ${title} • #${guildRelativeId} • ${guildName}

			It will end ${timeLeft}.

			End automation is set to: ${bold(endAutomation)}
		`;

		const rows = url
			? components.createRows(
					components.buttons
						.url({ label: "Go to giveaway", url })
						.component()
			  )
			: undefined;

		client.users
			.send(hostUserId, { content: string, components: rows })
			.catch(() => null);

		if (giveaway.endAutomation === "None") {
			return;
		}

		await prisma.giveaway.update({
			where: {
				id: giveaway.id
			},
			data: {
				hostNotified: "BeforeEnd"
			}
		});
	}

	/* ----------------- */

	for (const giveaway of toEnd) {
		const {
			channelId,
			endAutomation,
			guildId,
			guildRelativeId,
			hostUserId,
			announcementMessageId,
			title
		} = giveaway;

		const guild = client.guilds.cache.get(guildId);
		const guildName = guild?.name ?? "unknown server";

		const channel_ = channelId
			? guild?.channels.cache.get(channelId)
			: null;

		const channel = channel_?.isTextBased() ? channel_ : null;

		const url =
			channelId && announcementMessageId
				? messageURL(guildId, channelId, announcementMessageId)
				: null;

		const string = source`
			${bold("A giveaway you are hosting just ended!")} ${Emojis.Sparks}.
			  → ${title} • #${guildRelativeId} • ${guildName}.

			End automation was set to: ${bold(endAutomation)}.

			How to see winners:
			  1. Go to ${guildName}.
			  2. Open the dashboard of giveaway #${guildRelativeId}.
			  3. Click the "Show all winners" button.

			The winners have to manually claim their prizes.
			If a winner does not respond, you can re-roll unclaimed prizes.

			The winners can claim their prizes using:
			  a) The /my-giveaways command.
			  b) The "${Emojis.StarEyes} Accept Prize" button in the announcement.

			GG!
		`;

		const rows = url
			? components.createRows(
					components.buttons
						.url({ label: "Go to giveaway", url })
						.component()
			  )
			: undefined;

		client.users
			.send(hostUserId, { content: string, components: rows })
			.catch(() => null);

		if (giveaway.endAutomation === "None") {
			await prisma.giveaway.update({
				where: {
					id: giveaway.id
				},
				data: {
					hostNotified: "OnEnd"
				}
			});

			return;
		}

		await prisma.giveaway.update({
			where: {
				id: giveaway.id
			},
			data: {
				hostNotified: "OnEnd",
				ended: true,
				entriesLocked: true
			}
		});

		if (
			(giveaway.endAutomation !== "Roll" &&
				giveaway.endAutomation !== "Announce") ||
			!guild
		) {
			continue;
		}

		const module = new GiveawayModule(giveaway, guild);

		// TODO: set `notified` to true
		const winnerBucket = await rollAndSign({
			entries: giveaway.entriesUserIds,
			giveaway: module,
			ignoreRequirements: false,
			overrideClaimed: false,
			prizes: module.prizes,
			prizesQuantity: module.prizesQuantity(),
			winnerQuantity: module.winnerQuantity
		});

		if (giveaway.endAutomation === "Announce") {
			await module.winnerMessage?.delete();

			const rows = components.createRows(
				components.buttons.acceptPrize(giveaway.id)
			);

			let message: Message<true> | null | undefined;

			if (giveaway.announcementMessageId) {
				message = await module.announcementMessage
					?.reply({
						...module.endedEmbed(),
						components: rows
					})
					.catch(() => null);
			} else {
				message = await channel
					?.send({
						...module.endedEmbed(),
						components: rows
					})
					.catch(() => null);
			}

			if (message) {
				await prisma.giveaway.update({
					where: {
						id: giveaway.id
					},
					data: {
						winnerMessageId: message.id,
						winnerMessageUpdated: true
					}
				});
			} else {
				const msg = oneLine`
					${Emojis.Error} Failed to automatically announce winners for
					#${giveaway.guildRelativeId} in ${guild.name}.
				`;

				client.users.send(hostUserId, msg).catch(() => null);
			}

			const ids: Array<WinnerId> = [];

			if (winnerBucket) {
				await module.dmWinners({
					includeNotified: false,
					winners: winnerBucket
				});

				await module.manager.prisma.winner.updateMany({
					where: {
						id: { in: ids }
					},
					data: {
						notified: true
					}
				});
			}
		}
	}
}
