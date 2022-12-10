import { oneLine, stripIndents } from "common-tags";
import { type Interaction } from "discord.js";
import { REGEXP } from "../constants.js";
import GiveawayManager from "../database/giveaway.js";
import { listify } from "../helpers/listify.js";
import commandMap from "../helpers/scripts/commandMap.js";

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
		if (interaction.isButton()) {
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
			} else {
				entrants.add(interaction.user.id);

				interaction.followUp({
					content: stripIndents`
						Done! Psst... I made sure the bouncer put you first in line. Don't tell anyone, OK? 😇
						
						🎉 You are **now entered** into giveaway #${giveaway.guildRelativeId}. Best of luck!
						`,
					ephemeral: true
				});
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
