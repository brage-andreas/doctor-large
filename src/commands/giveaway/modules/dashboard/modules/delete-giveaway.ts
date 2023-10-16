import { type ButtonInteraction, ButtonStyle, bold } from "discord.js";
import type GiveawayManager from "#database/giveaway.js";
import { commandMention, yesNo } from "#helpers";
import { stripIndents } from "common-tags";
import toDashboard from "../dashboard.js";
import { Emojis } from "#constants";
import Logger from "#logger";

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
			embeds: [],
		});

		return;
	}

	const myGiveaways = await commandMention("my-giveaways", interaction);

	const isConcludedString = giveaway.ended
		? `\n\n${Emojis.Warn} It is recommended to keep ended giveaways. They can still be seen in the ${myGiveaways} command.`
		: "";

	const accept = await yesNo({
		data: {
			content: stripIndents`
				${Emojis.Warn} You are about to delete giveaway ${giveaway.asRelId}.
				This will also include any prizes and winners.${isConcludedString}

				Are you sure? Absolutely sure? This action will be ${bold("irreversible")}.
			`,
			embeds: [],
		},
		filter: () => true,
		medium: interaction,
		noStyle: ButtonStyle.Secondary,
		yesStyle: ButtonStyle.Danger,
	});

	if (!accept) {
		interaction
			.followUp({
				content: `Alright! Canceled deleting giveaway ${giveaway.asRelId}`,
				ephemeral: true,
			})
			.catch(() => null);

		void toDashboard(interaction, id);

		return;
	}

	const createdWithinFifteenMinutes = Date.now() - giveaway.createdAt.getTime() <= 900_000; // 900 000 ms = 15 min

	if (!createdWithinFifteenMinutes) {
		const accept2 = await yesNo({
			data: {
				content: stripIndents`
						${Emojis.Error} You are about to delete giveaway ${giveaway.asRelId}.
					This will also include any prizes and winners.${isConcludedString}
	
					ARE YOU ABSOLUTELY CERTAIN?
				`,
				embeds: [],
			},
			filter: () => true,
			medium: interaction,
			noStyle: ButtonStyle.Secondary,
			yesStyle: ButtonStyle.Danger,
		});

		if (!accept2) {
			interaction
				.followUp({
					content: `Alright! Canceled deleting giveaway ${giveaway.asRelId}`,
					ephemeral: true,
				})
				.catch(() => null);

			void toDashboard(interaction, id);

			return;
		}
	}

	await giveaway.delete({ withAnnouncementMessages: true });

	new Logger({ interaction, label: "GIVEAWAY" }).log(`Deleted giveaway #${giveaway.id}`);

	interaction
		.editReply({
			components: [],
			content: `${Emojis.Check} Successfully deleted giveaway ${giveaway.asRelId}.`,
			embeds: [],
		})
		.catch(() => null);
}
