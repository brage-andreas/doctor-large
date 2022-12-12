import { type ChatInputCommandInteraction } from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import GiveawayManager from "../../database/giveaway.js";
import sendToDashboard from "./mod.dashboard.js";

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
				content:
					"Something went wrong. The time limit is 3 minutes. Try again!"
			});
		});

	if (!modalInteraction) {
		return;
	}

	const giveawayManager = new GiveawayManager(interaction.guildId);

	const giveawayTitle = modalInteraction.fields.getTextInputValue("title");

	const giveawayDescription =
		modalInteraction.fields.getTextInputValue("description");

	const numberOfWinners = Number(
		modalInteraction.fields.getTextInputValue("numberOfWinners")
	);

	const totalNumberOfGiveaways =
		await giveawayManager.getTotalNumberOfGiveawaysInGuild();

	const { giveawayId } = await giveawayManager.create({
		guildRelativeId: totalNumberOfGiveaways + 1,
		giveawayTitle,
		giveawayDescription,
		numberOfWinners,
		guildId: interaction.guildId,
		hostUserId: interaction.user.id,
		hostUserTag: interaction.user.tag,
		createdTimestamp: interaction.createdTimestamp.toString()
	});

	await modalInteraction.deferUpdate();

	sendToDashboard(modalInteraction, giveawayId);
}
