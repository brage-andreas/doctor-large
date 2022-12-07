import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	type ChatInputCommandInteraction
} from "discord.js";
import GiveawayManager from "../../database/giveaway.js";

/*

	{
		name: "title",
		type: ApplicationCommandOptionType.String,
		description: oneLine`
			The title for the giveaway.
			For example "Christmas Giveaway 2022".
		`,
		required: true
	},
	{
		name: "description",
		type: ApplicationCommandOptionType.String,
		description: oneLine`
			The description for the giveaway.
			Put any addition info here.
			[None]
		`
	},
	{
		name: "number-of-winners",
		type: ApplicationCommandOptionType.Integer,
		description: "How many winners there should be. [1]",
		min_value: 1
	}

*/

const modalGiveawayTitle = new TextInputBuilder()
	.setCustomId("title")
	.setLabel("Title")
	.setMaxLength(50)
	.setStyle(TextInputStyle.Short)
	.setRequired(true)
	.setPlaceholder("Christmas Giveaway 2022!");

const modalGiveawayDescription = new TextInputBuilder()
	.setCustomId("description")
	.setLabel("Description [None]")
	.setMaxLength(512)
	.setStyle(TextInputStyle.Paragraph)
	.setPlaceholder(
		oneLine`
				It's this time of year again!
				This is a thanks for a good year 💝
			`
	);

const modalGiveawayNumberOfWinners = new TextInputBuilder()
	.setCustomId("number-of-winners")
	.setLabel("Number of winners [1]")
	.setMaxLength(2)
	.setStyle(TextInputStyle.Short)
	.setPlaceholder("1");

const createOptionsModal = new ModalBuilder()
	.setTitle("Create a giveaway (3 min)")
	.setCustomId("giveawayCreate")
	.setComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayTitle
		),
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayDescription
		),
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			modalGiveawayNumberOfWinners
		)
	);

export default async function (
	interaction: ChatInputCommandInteraction<"cached">
) {
	await interaction.showModal(createOptionsModal);

	const modalResponse = await interaction
		.awaitModalSubmit({
			filter: (interaction) => interaction.customId === "giveawayCreate",
			time: 180_000
		})
		.catch(async () => {
			await interaction.editReply({
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

	const data = await giveawayManager.create({
		guildRelativeId: totalNumberOfGiveaways + 1,
		giveawayTitle,
		giveawayDescription,
		active: false,
		numberOfWinners,
		prizes: undefined,
		guildId: interaction.guildId,
		channelId: null,
		messageId: null,
		hostUserId: interaction.user.id,
		hostUserTag: interaction.user.tag,
		userEntriesIds: [],
		lockEntries: false,
		createdTimestamp: interaction.createdTimestamp.toString(),
		endTimestamp: null,
		winnerUserIds: []
	});

	modalResponse.reply({
		embeds: [giveawayManager.toEmbed(data, interaction.client)]
	});
}
