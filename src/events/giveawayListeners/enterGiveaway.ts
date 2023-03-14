import { Emojis, RegExp } from "#constants";
import GiveawayManager from "#database/giveaway.js";
import { listify } from "#helpers/listify.js";
import { timestamp } from "#helpers/timestamps.js";
import Logger from "#logger";
import { oneLine, stripIndents } from "common-tags";
import { bold, type ButtonInteraction } from "discord.js";

export default async function enterGiveaway(
	interaction: ButtonInteraction<"cached">
) {
	const id = interaction.customId.match(RegExp.EnterGiveawayCustomId)?.groups
		?.id;

	if (!id) {
		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const giveawayManager = new GiveawayManager(interaction.guild);

	const giveaway = await giveawayManager.get(Number(id));

	if (!giveaway) {
		return;
	}

	if (giveaway.entriesLocked) {
		interaction.followUp({
			content: `${Emojis.Lock} Sorry, but new entries are currently locked. Try again later.`,
			ephemeral: true
		});

		return;
	}

	if (!giveaway.memberHasRequiredRoles(interaction.member)) {
		const rolesTheyHave = new Set(interaction.member.roles.cache.keys());

		const rolesTheyNeed = [...giveaway.requiredRolesIds]
			.filter((roleId) => !rolesTheyHave.has(roleId))
			.map((roleId) => `<@&${roleId}>`);

		interaction.followUp({
			content: stripIndents`
				${Emojis.Lock} Sorry, but you don't have all the roles required to enter.

				You are missing ${rolesTheyNeed.length || "no"} roles: ${
				rolesTheyNeed.length
					? listify(rolesTheyNeed, { length: 10 })
					: "No roles... what? Try again."
			}
			`,
			ephemeral: true
		});

		return;
	}

	if (!giveaway.isOldEnough(interaction.member)) {
		const minimumAccountAge = Number(giveaway.minimumAccountAge);

		const accountAge = Date.now() - interaction.user.createdTimestamp;

		const whenTheyWillBeOldEnough = timestamp(
			Date.now() + minimumAccountAge - accountAge,
			"R"
		);

		interaction.followUp({
			content: stripIndents`
					${Emojis.Lock} Sorry, your account isn't old enough to enter.

					Your account will be old enough ${whenTheyWillBeOldEnough}.
				`,
			ephemeral: true
		});

		return;
	}

	const entrants = new Set(giveaway.entriesUserIds);

	if (entrants.has(interaction.user.id)) {
		entrants.delete(interaction.user.id);

		interaction.followUp({
			content: stripIndents`
				Done! I removed your entry.
				
				You are ${bold("no longer entered")} into giveaway ${giveaway.asRelId}.
				I already miss you. ${Emojis.Pensive}
			`,
			ephemeral: true
		});

		new Logger({
			color: "grey",
			prefix: "GIVEAWAY"
		}).log(
			oneLine`
				User ${interaction.user.tag} (${interaction.user.id})
				left giveaway #${giveaway.id}
			`
		);
	} else {
		entrants.add(interaction.user.id);

		interaction.followUp({
			content: stripIndents`
				Done! Psst... I made sure the bouncer put you first in line. Don't tell anyone, OK? ${
					Emojis.Halo
				}
				
				${Emojis.Tada} You are ${bold("now entered")} into giveaway #${
				giveaway.guildRelativeId
			}. Best of luck!
				`,
			ephemeral: true
		});

		new Logger({
			color: "grey",
			prefix: "GIVEAWAY"
		}).log(
			oneLine`
				User ${interaction.user.tag} (${interaction.user.id})
				entered giveaway #${giveaway.id}
			`
		);
	}

	giveaway.edit({
		entriesUserIds: [...entrants],
		nowOutdated: {
			none: true
		}
	});
}
