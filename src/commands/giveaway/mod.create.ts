import { type ChatInputCommandInteraction } from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import GiveawayManager from "../../database/giveaway.js";
import sendToDashboard from "./mod.dashboard.js";

export default async function (
	interaction: ChatInputCommandInteraction<"cached">
) {
	await interaction.showModal(giveawayComponents.create.optionsModal());

	const modalResponse = await interaction
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

	if (!modalResponse) {
		return;
	}

	const giveawayManager = new GiveawayManager(interaction.guildId);

	const giveawayTitle = modalResponse.fields.getTextInputValue("title");

	const giveawayDescription =
		modalResponse.fields.getTextInputValue("description");

	const numberOfWinners = Number(
		modalResponse.fields.getTextInputValue("numberOfWinners")
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

	const message = await modalResponse.deferReply({ fetchReply: true });

	sendToDashboard(message, giveawayId);
}
