import { type Giveaway } from "@prisma/client";
import { source } from "common-tags";
import { type Client } from "discord.js";
import { fileURLToPath } from "node:url";
import { isMainThread, Worker } from "node:worker_threads";
import { rollAndSign } from "./commands/giveaway/giveawayModules/endModules/rollWinners/rollAndSign.js";
import { EMOJIS, GIVEAWAY } from "./constants.js";
import prisma from "./database/prisma.js";
import { longStamp } from "./helpers/timestamps.js";
import Logger from "./logger/logger.js";
import GiveawayModule from "./modules/Giveaway.js";

const __filename = fileURLToPath(import.meta.url);
const dmBuffer = GIVEAWAY.END_HOST_DM_BEFORE_END;
let once = true;

export default function spawnWorker(params: {
	client: Client<true>;
	checkEndingGiveaways?: boolean;
}) {
	if (isMainThread && once) {
		const worker = new Worker(__filename);

		worker.on("message", (message) => {
			new Logger({ prefix: "WORKER", color: "grey" }).log(message);
		});

		once = false;
	}

	const { client, checkEndingGiveaways } = params;

	if (checkEndingGiveaways) {
		setInterval(() => {
			(async () => {
				/* ----------------- */
				/* --- Giveaways --- */
				/* ----------------- */

				const now = Date.now();
				const nowWithBuffer = now + dmBuffer;

				const lte = new Date(nowWithBuffer).toISOString();

				const all = await prisma.giveaway.findMany({
					where: {
						ended: false,
						endDate: {
							lte
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

						const typeGuardedGiveaway = giveaway as Giveaway & {
							endDate: Date;
						};

						const hasEnded = endDate.getTime() <= now;

						const withinBuffer =
							typeGuardedGiveaway.hostNotified !==
								"BufferBefore" &&
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
						client.guilds.cache.get(guildId)?.name ??
						"unknown server";

					const url =
						channelId && publishedMessageId
							? `https://discord.com/channels/${guildId}/${channelId}/${publishedMessageId}`
							: null;

					const timeLeft = longStamp(
						endDate.getTime() - GIVEAWAY.END_HOST_DM_BEFORE_END,
						{ extraLong: true }
					);

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
						client.guilds.cache.get(guildId)?.name ??
						"unknown server";

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
						const giveawayWithIncludes =
							await prisma.giveaway.findUnique({
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
							new Logger({ prefix: "WORKER", color: "red" }).log(
								`Giveaway with includes failed to find giveaway for ID: ${giveaway.id}`
							);

							return;
						}

						if (!guild) {
							new Logger({ prefix: "WORKER", color: "red" }).log(
								`Failed to find guild ${guildId} for giveaway ${giveaway.id}`
							);

							return;
						}

						const module = new GiveawayModule(
							giveawayWithIncludes,
							guild
						);

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
			})();
		}, 60_000);
	}
}
