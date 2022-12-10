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
			filter: (interaction) => interaction.customId === "giveawayCreate",
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

	const numberOfWinners =
		Number(modalResponse.fields.getTextInputValue("number-of-winners")) ??
		1;

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

	await modalResponse.deferReply();

	sendToDashboard(modalResponse, giveawayId);
}
