import { oneLine, stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type Client,
	type Message
} from "discord.js";
import { rollAndSign } from "./commands/giveaway/giveawayModules/endModules/rollWinners/rollAndSign.js";
import { EMOJIS, GIVEAWAY } from "./constants.js";
import prisma from "./database/prisma.js";
import { longstamp } from "./helpers/timestamps.js";
import GiveawayModule from "./modules/Giveaway.js";
import { type GiveawayWithIncludes } from "./typings/database.js";
import { type WinnerId } from "./typings/index.js";

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
			publishedMessageId,
			title
		} = giveaway;

		const guildName =
			client.guilds.cache.get(guildId)?.name ?? "unknown server";

		const url =
			channelId && publishedMessageId
				? `https://discord.com/channels/${guildId}/${channelId}/${publishedMessageId}`
				: null;

		const timeLeft = longstamp(endDate, { extraLong: true, reverse: true });

		const string = stripIndents`
			**Giveaway is about to end.**

			A giveaway you are hosting ends ${timeLeft}
				
			#${guildRelativeId} ${title} (in ${guildName})
			
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

		const guild = client.guilds.cache.get(guildId);
		const guildName = guild?.name ?? "unknown server";

		const channel_ = channelId
			? guild?.channels.cache.get(channelId)
			: null;

		const channel = channel_?.isTextBased() ? channel_ : null;

		const url =
			channelId && publishedMessageId
				? `https://discord.com/channels/${guildId}/${channelId}/${publishedMessageId}`
				: null;

		const string = stripIndents`
			**Giveaway has ended.**

			A giveaway you are hosting just ended ${EMOJIS.SPARKS}.

			#${guildRelativeId} ${title} (in ${guildName})
			
			End automation was set to: ${endAutomation}
			
			Here is a link to the giveaway:
			${url}
		`;

		client.users.send(hostUserId, string).catch(() => null);

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
				giveaway.endAutomation !== "Publish") ||
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

		if (giveaway.endAutomation === "Publish") {
			await module.winnerMessage?.delete();

			const acceptPrizeButton = new ButtonBuilder()
				.setCustomId(`accept-prize-${giveaway.id}`)
				.setLabel("Accept prize")
				.setEmoji(EMOJIS.STAR_EYES)
				.setStyle(ButtonStyle.Success);

			const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
				acceptPrizeButton
			);

			let message: Message<true> | null | undefined;

			if (giveaway.publishedMessageId) {
				message = await module.publishedMessage
					?.reply({
						...module.endedEmbed(),
						components: [row]
					})
					.catch(() => null);
			} else {
				message = await channel
					?.send({
						...module.endedEmbed(),
						components: [row]
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
					${EMOJIS.ERROR} Failed to publish winners for
					#${giveaway.guildRelativeId} in ${guild.name}.
				`;

				client.users.send(hostUserId, msg).catch(() => null);
			}

			const ids: Array<WinnerId> = [];

			if (winnerBucket) {
				winnerBucket.forEach(({ userId, id }) => {
					ids.push(id);

					const url =
						message?.url ?? module.publishedMessageURL ?? "";

					const msg = stripIndents`
						${EMOJIS.TADA} You just **won a giveaway** in ${guild.name}!

						Giveaway #${giveaway.guildRelativeId} ${giveaway.title}

						Make sure to **claim your prize(s)**!
						You can to do by using /my-giveaways in the server,
						or clicking the "${EMOJIS.STAR_EYES} Accept Prize" button.

						${url ? `Here is a link to the giveaway:\n${url}\n\n` : ""}GG!
					`;

					client.users.send(userId, msg).catch(() => null);
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
