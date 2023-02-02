import { type Giveaway } from "@prisma/client";
import { source } from "common-tags";
import { type Client } from "discord.js";
import ms from "ms";
import { fileURLToPath } from "node:url";
import { isMainThread, Worker } from "node:worker_threads";
import { GIVEAWAY } from "./constants.js";
import prisma from "./database/prisma.js";
import Logger from "./logger/logger.js";

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

						if (!endDate) {
							return [toEnd, toNotifyBefore];
						}

						const hasEnded = endDate.getTime() <= now;

						const withinBuffer =
							giveaway.hostNotified !== "BufferBefore" &&
							nowWithBuffer * 0.8 <= endDate.getTime() &&
							endDate.getTime() <= nowWithBuffer;

						if (hasEnded) {
							toEnd.push(giveaway);
						} else if (withinBuffer) {
							toNotifyBefore.push(giveaway);
						}

						return [toEnd, toNotifyBefore];
					},
					[[], []] as [Array<Giveaway>, Array<Giveaway>]
				);

				for (const giveaway of toNotify) {
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

					const timeLeft = ms(GIVEAWAY.END_HOST_DM_BEFORE_END, {
						long: true
					});

					const string = source`
						A giveaway you are hosting ends in ${timeLeft}
						  → Giveaway ${guildRelativeId} (in ${guild})
						    \`${title}\`
						
						End automation is set to: ${endAutomation}
						
						Here is a link to the giveaway:
						${url}
					`;

					client.users.send(hostUserId, string).catch(() => null);

					await prisma.giveaway.update({
						where: {
							id: giveaway.id
						},
						data: {
							hostNotified: "BufferBefore"
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

					const timeLeft = ms(GIVEAWAY.END_HOST_DM_BEFORE_END, {
						long: true
					});

					const string = source`
						A giveaway you are hosting just ended in ${timeLeft}
						  → Giveaway ${guildRelativeId} (in ${guild})
						    \`${title}\`
						
						End automation was set to: ${endAutomation}
						
						Here is a link to the giveaway:
						${url}
					`;

					client.users.send(hostUserId, string).catch(() => null);

					await prisma.giveaway.update({
						where: {
							id: giveaway.id
						},
						data: {
							hostNotified: "OnEnd"
						}
					});
				}
			})();
		}, 60_000);
	}
}
