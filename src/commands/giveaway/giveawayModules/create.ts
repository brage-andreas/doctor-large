import { type ChatInputCommandInteraction } from "discord.js";
import { giveawayComponents } from "../../../components/index.js";
import GiveawayManager from "../../../database/giveaway.js";
import Logger from "../../../logger/logger.js";
import toDashboard from "./dashboard.js";

export default async function (
	interaction: ChatInputCommandInteraction<"cached">
) {
	await interaction.showModal(giveawayComponents.create.optionsModal());

	const modalInteraction = await interaction
		.awaitModalSubmit({
			filter: (interaction) => interaction.customId === "createGiveaway",
			time: 180_000
		})
		.catch(async () => {
			await interaction.followUp({
				ephemeral: true,
				content:
					"Something went wrong. The time limit is 3 minutes. Try again!"
			});
		});

	if (!modalInteraction?.fields.fields.size) {
		return;
	}

	const giveawayManager = new GiveawayManager(interaction.guildId);

	const title = modalInteraction.fields.getTextInputValue("title");

	const description =
		modalInteraction.fields.getTextInputValue("description");

	const winnerQuantity = Number(
		modalInteraction.fields.getTextInputValue("winnerQuantity")
	);

	const totalNumberOfGiveaways = await giveawayManager.getQuantityInGuild();

	const { id } = await giveawayManager.create({
		createdTimestamp: interaction.createdTimestamp.toString(),
		guildRelativeId: totalNumberOfGiveaways + 1,
		winnerQuantity,
		hostUserTag: interaction.user.tag,
		hostUserId: interaction.user.id,
		description,
		guildId: interaction.guildId,
		title
	});

	new Logger({ prefix: "GIVEAWAY", interaction }).log(
		`Created giveaway with ID #${id}`
	);

	await modalInteraction.deferReply({ ephemeral: true }).catch(() => null);

	toDashboard(modalInteraction, id);
}
