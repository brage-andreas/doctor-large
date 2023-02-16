import { type Giveaway } from "@prisma/client";
import { source } from "common-tags";
import { type Client } from "discord.js";
import { rollAndSign } from "./commands/giveaway/giveawayModules/endModules/rollWinners/rollAndSign.js";
import { EMOJIS, GIVEAWAY } from "./constants.js";
import prisma from "./database/prisma.js";
import { longstamp } from "./helpers/timestamps.js";
import Logger from "./logger/logger.js";
import GiveawayModule from "./modules/Giveaway.js";

const DM_BUFFER = GIVEAWAY.END_HOST_DM_BEFORE_END;

const checkEndingGiveawaysFn = async (client: Client<true>) => {
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
		}
	});

	const [toEnd, toNotify] = all.reduce(
		([toEnd, toNotifyBefore], giveaway) => {
			const { endDate } = giveaway;

			// Should never be null based on the query
			if (!endDate) {
				return [toEnd, toNotifyBefore];
			}

			const typeGuardedGiveaway = giveaway as Giveaway & {
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
			Array<Giveaway & { endDate: Date }>,
			Array<Giveaway & { endDate: Date }>
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
			publishedMessageId,
			title
		} = giveaway;

		const guild =
			client.guilds.cache.get(guildId)?.name ?? "unknown server";

		const url =
			channelId && publishedMessageId
				? `https://discord.com/channels/${guildId}/${channelId}/${publishedMessageId}`
				: null;

		const timeLeft = longstamp(endDate, { extraLong: true, reverse: true });

		const string = source`
				**Giveaway is about to end.**

				A giveaway you are hosting ends ${timeLeft}
				  → Giveaway ${guildRelativeId} (in ${guild})
					\`${title}\`
				
				End automation is set to: ${endAutomation}
				
				Here is a link to the giveaway:
				${url}
			`;

		client.users.send(hostUserId, string).catch(() => null);

		if (giveaway.endAutomation === "None") {
			return;
		}

		await prisma.giveaway.update({
			where: {
				id: giveaway.id
			},
			data: {
				hostNotified: "OnEnd"
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
			publishedMessageId,
			title
		} = giveaway;

		const guild =
			client.guilds.cache.get(guildId)?.name ?? "unknown server";

		const url =
			channelId && publishedMessageId
				? `https://discord.com/channels/${guildId}/${channelId}/${publishedMessageId}`
				: null;

		const string = source`
				**Giveaway has ended.**

				A giveaway you are hosting just ended ${EMOJIS.SPARKS}
				  → Giveaway ${guildRelativeId} (in ${guild})
					\`${title}\`
				
				End automation was set to: ${endAutomation}
				
				Here is a link to the giveaway:
				${url}
			`;

		client.users.send(hostUserId, string).catch(() => null);

		if (giveaway.endAutomation === "None") {
			return;
		}

		await prisma.giveaway.update({
			where: {
				id: giveaway.id
			},
			data: {
				hostNotified: "BufferBefore",
				ended: true,
				entriesLocked: true
			}
		});

		if (giveaway.endAutomation === "Roll") {
			const giveawayWithIncludes = await prisma.giveaway.findUnique({
				where: {
					id: giveaway.id
				},
				include: {
					prizes: {
						include: {
							winners: true
						}
					}
				}
			});

			const guild = client.guilds.cache.get(giveaway.guildId);

			if (!giveawayWithIncludes) {
				new Logger({
					prefix: "WORKER",
					color: "red"
				}).log(
					`Giveaway with includes failed to find giveaway for ID: ${giveaway.id}`
				);

				return;
			}

			if (!guild) {
				new Logger({
					prefix: "WORKER",
					color: "red"
				}).log(
					`Failed to find guild ${guildId} for giveaway ${giveaway.id}`
				);

				return;
			}

			const module = new GiveawayModule(giveawayWithIncludes, guild);

			await rollAndSign({
				entries: giveaway.entriesUserIds,
				giveaway: module,
				ignoreRequirements: false,
				overrideClaimed: false,
				prizes: module.prizes,
				prizesQuantity: module.prizesQuantity(),
				winnerQuantity: module.winnerQuantity
			});
		}
	}
};

export default function ({
	client,
	checkEndingGiveaways
}: {
	client: Client<true>;
	checkEndingGiveaways?: boolean;
}) {
	if (checkEndingGiveaways) {
		checkEndingGiveawaysFn(client);
	}
}
