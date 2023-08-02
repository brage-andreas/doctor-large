import { Emojis } from "#constants";
import type GiveawayManager from "#database/giveaway.js";
import { commandMention, yesNo } from "#helpers";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import { ButtonStyle, bold, type ButtonInteraction } from "discord.js";
import toDashboard from "../dashboard.js";

export default async function toDeleteGiveaway(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		await interaction.editReply({
			components: [],
			content: stripIndents`
				How did we get here?
			
				${Emojis.Error} This giveaway does not exist. Try creating one or double-check the ID.
			`,
			embeds: []
		});

		return;
	}

	const myGiveaways = await commandMention("my-giveaways", interaction);

	const isConcludedString = giveaway.ended
		? `\n\n${Emojis.Warn} It is recommended to keep ended giveaways. They can still be seen in the ${myGiveaways} command.`
		: "";

	const accept = await yesNo({
		yesStyle: ButtonStyle.Danger,
		noStyle: ButtonStyle.Secondary,
		medium: interaction,
		filter: () => true,
		data: {
			content: stripIndents`
				${Emojis.Warn} You are about to delete giveaway ${giveaway.asRelId}.
				This will also include any prizes and winners.${isConcludedString}

				Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
			`,
			embeds: []
		}
	});

	if (!accept) {
		interaction.followUp({
			ephemeral: true,
			content: `Alright! Canceled deleting giveaway ${giveaway.asRelId}`
		});

		toDashboard(interaction, id);

		return;
	}

	const createdWithinFifteenMinutes =
		Date.now() - giveaway.createdAt.getTime() <= 900_000; // 900 000 ms = 15 min

	if (!createdWithinFifteenMinutes) {
		const accept2 = await yesNo({
			yesStyle: ButtonStyle.Danger,
			noStyle: ButtonStyle.Secondary,
			medium: interaction,
			filter: () => true,
			data: {
				content: stripIndents`
						${Emojis.Error} You are about to delete giveaway ${giveaway.asRelId}.
					This will also include any prizes and winners.${isConcludedString}
	
					ARE YOU ABSOLUTELY CERTAIN?
				`,
				embeds: []
			}
		});

		if (!accept2) {
			interaction.followUp({
				ephemeral: true,
				content: `Alright! Canceled deleting giveaway ${giveaway.asRelId}`
			});

			toDashboard(interaction, id);

			return;
		}
	}

	await giveaway.delete({ withAnnouncementMessages: true });

	new Logger({ label: "GIVEAWAY", interaction }).log(
		`Deleted giveaway #${giveaway.id}`
	);

	interaction.editReply({
		components: [],
		content: `${Emojis.Check} Successfully deleted giveaway ${giveaway.asRelId}.`,
		embeds: []
	});
}
