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

				const lte = new Date(Date.now() + dmBuffer).toISOString();

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

						const hasEnded = endDate.getTime() <= Date.now();

						const bufferBeforeMax =
							endDate.getTime() <= Date.now() + dmBuffer;

						const bufferBeforeMin =
							endDate.getTime() <= Date.now() + dmBuffer * 0.8;

						if (hasEnded) {
							toEnd.push(giveaway);
						} else if (bufferBeforeMax && bufferBeforeMin) {
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

				toEnd;

				/* ----------------- */
			})();
		}, 60_000);
	}
}
