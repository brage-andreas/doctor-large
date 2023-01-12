import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	Message,
	type AutocompleteInteraction,
	type ButtonInteraction,
	type Interaction,
	type MessageEditOptions
} from "discord.js";
import { EMOJIS } from "../constants.js";

export default async function yesNo(options: {
	respondToIgnore?: boolean;
	timeActive?: number;
	yesStyle?: ButtonStyle;
	noStyle?: ButtonStyle;
	medium: Exclude<Interaction, AutocompleteInteraction> | Message;
	data: Exclude<MessageEditOptions, "Components">;
	filter?(interaction: ButtonInteraction): boolean;
}): Promise<boolean> {
	const { medium, data, filter } = options;

	const respondToIgnore = options.respondToIgnore ?? true;
	const yesStyle = options.yesStyle ?? ButtonStyle.Success;
	const noStyle = options.noStyle ?? ButtonStyle.Danger;
	const time = options.timeActive ?? 60_000;

	const yesButton = new ButtonBuilder()
		.setCustomId("yes")
		.setEmoji(EMOJIS.V)
		.setStyle(yesStyle)
		.setLabel("Yes");

	const noButton = new ButtonBuilder()
		.setCustomId("no")
		.setEmoji(EMOJIS.X)
		.setStyle(noStyle)
		.setLabel("No");

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		yesButton,
		noButton
	);

	let message: Message;

	if (medium instanceof Message) {
		message = await medium.edit({ ...data, components: [row] });
	} else {
		message = await medium.editReply({ ...data, components: [row] });
	}

	return new Promise((resolve, reject) => {
		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter,
			time,
			max: 1
		});

		if (respondToIgnore) {
			collector.on("ignore", (interaction) => {
				interaction
					.reply({
						content: `${EMOJIS.NO_ENTRY} This button is not for you.`,
						ephemeral: true
					})
					.catch(() => null);
			});
		}

		collector.on("collect", async (collectedInteraction) => {
			await collectedInteraction.deferUpdate().catch(() => null);

			if (collectedInteraction.customId === "yes") {
				resolve(undefined);
			} else {
				reject();
			}
		});

		collector.on("end", (collected) => {
			if (!collected.size) {
				reject();
			}
		});
	})
		.then(() => true)
		.catch(() => false);
}
