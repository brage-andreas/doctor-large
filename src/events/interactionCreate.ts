import { oneLine, stripIndents } from "common-tags";
import { type Interaction } from "discord.js";
import { EMOJIS, REGEXP } from "../constants.js";
import GiveawayManager from "../database/giveaway.js";
import { listify } from "../helpers/listify.js";
import commandMap from "../helpers/scripts/commandMap.js";
import { timestamp } from "../helpers/timestamps.js";
import Logger from "../logger/logger.js";

export async function run(interaction: Interaction) {
	if (!interaction.inGuild()) {
		// All interactions are repliable except autocomplete
		if (interaction.isRepliable()) {
			// Give it some personality
			const randomGreetLine = () => {
				const greetings = [
					"Oh, hi!",
					"Heeey!",
					"Hellooo!",
					"God, you scared me!"
				];

				return greetings.at(
					Math.floor(Math.random() * greetings.length)
				);
			};

			interaction.reply({
				content: oneLine`
					${randomGreetLine()}
					I see you found my hiding spot...
					Anyways, try finding me inside a server.
				`,
				ephemeral: true
			});
		}

		return;
	}

	if (!interaction.inCachedGuild()) {
		// All interactions are repliable except autocomplete
		if (interaction.isRepliable()) {
			interaction.reply({
				content: oneLine`
					Something went wrong...
					Maybe I'm out of wine 🤔
				`,
				ephemeral: true
			});
		}

		return;
	}

	if (
		!interaction.isChatInputCommand() &&
		!interaction.isContextMenuCommand() &&
		!interaction.isAutocomplete()
	) {
		if (!interaction.isButton()) {
			return;
		}

		if (REGEXP.GIVEAWAY_ENTRY_BUTTON_CUSTOM_ID.test(interaction.customId)) {
			const giveawayId = interaction.customId.match(
				REGEXP.GIVEAWAY_ENTRY_BUTTON_CUSTOM_ID
			)?.groups?.id;

			if (!giveawayId) {
				return;
			}

			await interaction.deferReply({ ephemeral: true });

			const giveawayManager = new GiveawayManager(interaction.guildId);

			const giveaway = await giveawayManager.get(Number(giveawayId));

			if (!giveaway) {
				return;
			}

			if (giveaway.lockEntries) {
				interaction.followUp({
					content:
						"🔒 Sorry, new entries are currently locked. Try again later.",
					ephemeral: true
				});

				return;
			}

			if (
				!interaction.member.roles.cache.hasAll(
					...giveaway.requiredRoles
				)
			) {
				const rolesTheyHave = new Set(
					interaction.member.roles.cache.keys()
				);

				const rolesTheyNeed = giveaway.requiredRoles
					.filter((roleId) => !rolesTheyHave.has(roleId))
					.map((roleId) => `<@&${roleId}>`);

				interaction.followUp({
					content: stripIndents`
							🔒 Sorry, you don't have all the roles required to enter.

							You are missing roles: ${
								rolesTheyNeed.length
									? listify(rolesTheyNeed, { length: 10 })
									: "No roles... what? Try again."
							}
						`,
					ephemeral: true
				});

				return;
			}

			const minimumAccountAge =
				giveaway.minimumAccountAge &&
				Number(giveaway.minimumAccountAge);

			const accountAge = Date.now() - interaction.user.createdTimestamp;

			if (minimumAccountAge && accountAge < minimumAccountAge) {
				const whenTheyWillBeOldEnough = timestamp(
					Date.now() + minimumAccountAge - accountAge,
					"R"
				);

				interaction.followUp({
					content: stripIndents`
							🔒 Sorry, your account isn't old enough to enter.

							Your account will be old enough ${whenTheyWillBeOldEnough}.
						`,
					ephemeral: true
				});

				return;
			}

			const entrants = new Set(giveaway.userEntriesIds);

			if (entrants.has(interaction.user.id)) {
				entrants.delete(interaction.user.id);

				interaction.followUp({
					content: stripIndents`
						Done! I removed your entry.
						
						You are **no longer entered** into giveaway #${giveaway.guildRelativeId}. I already miss you. 🥺
					`,
					ephemeral: true
				});

				new Logger({
					color: "grey",
					prefix: "GIVEAWAY"
				}).log(
					oneLine`
						User ${interaction.user.tag} (${interaction.user.id})
						left giveaway #${giveaway.giveawayId}
					`
				);
			} else {
				entrants.add(interaction.user.id);

				interaction.followUp({
					content: stripIndents`
						Done! Psst... I made sure the bouncer put you first in line. Don't tell anyone, OK? 😇
						
						🎉 You are **now entered** into giveaway #${giveaway.guildRelativeId}. Best of luck!
						`,
					ephemeral: true
				});

				new Logger({
					color: "grey",
					prefix: "GIVEAWAY"
				}).log(
					oneLine`
						User ${interaction.user.tag} (${interaction.user.id})
						entered giveaway #${giveaway.giveawayId}
					`
				);
			}

			giveawayManager.edit({
				where: {
					giveawayId: Number(giveawayId)
				},
				data: {
					userEntriesIds: [...entrants]
				}
			});
		}

		if (
			REGEXP.GIVEAWAY_ACCEPT_PRIZE_BUTTON_CUSTOM_ID.test(
				interaction.customId
			)
		) {
			const giveawayId = interaction.customId.match(
				REGEXP.GIVEAWAY_ENTRY_BUTTON_CUSTOM_ID
			)?.groups?.id;

			if (!giveawayId) {
				return;
			}

			await interaction.deferReply({ ephemeral: true });

			const giveawayManager = new GiveawayManager(interaction.guildId);

			const giveaway = await giveawayManager.get(Number(giveawayId));

			if (!giveaway) {
				return;
			}

			const winners = new Set(
				giveaway.prizes
					.map((prize) => prize.winner?.userId)
					.filter((e) => Boolean(e))
			);

			if (!winners.has(interaction.user.id)) {
				interaction.followUp({
					content: stripIndents`
						💔 You don't have any prizes to claim.
						
						Better luck next time. 😊
					`,
					ephemeral: true
				});

				return;
			}

			const prize = giveaway.prizes.find(prize => prize.winner?.userId === interaction.user.id)

			if (!prize || !prize.winner) {
				//

				return
			}

			if (prize.winner.accepted) {
				interaction.followUp({
					content: stripIndents`
						${EMOJIS.V} You have already claimed your prize.
						
						You're all set! 😁
					`,
					ephemeral: true
				});

				return;
			}


				interaction.followUp({
					content: stripIndents`
						🎉 You have **now claimed** your prize! Woo!
						
						To remind you of your extrodinary success:
						You won ${prize.amount}x **${prize.name}** in giveaway #${giveaway.guildRelativeId}.${prize.additionalInfo ? `\n→ ${prize.additionalInfo}` : ""}
					`,
					ephemeral: true
				});

				new Logger({
					color: "grey",
					prefix: "GIVEAWAY"
				}).log(
					oneLine`
						User ${interaction.user.tag} (${interaction.user.id})
						entered giveaway #${giveaway.giveawayId}
					`
				);
			}

			giveawayManager.edit({
				where: {
					giveawayId: Number(giveawayId)
				},
				data: {
					userEntriesIds: [...entrants]
				}
			});
		}

		return;
	}

	const command = commandMap.get(interaction.commandName);

	if (!command) {
		// this should never happen
		throw new Error(
			`Commands mismatch: ${interaction.commandName} not in command map`
		);
	}

	void (await command.run(interaction));
}
