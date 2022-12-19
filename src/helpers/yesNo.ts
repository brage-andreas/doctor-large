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
	yesStyle?: ButtonStyle;
	noStyle?: ButtonStyle;
	medium: Exclude<Interaction, AutocompleteInteraction> | Message;
	time?: number;
	data: Exclude<MessageEditOptions, "Components">;
	filter(interaction: ButtonInteraction): boolean;
}) {
	const { yesStyle, noStyle, medium, time, data, filter } = options;

	const yesButton = new ButtonBuilder()
		.setCustomId("yes")
		.setEmoji(EMOJIS.V)
		.setStyle(yesStyle ?? ButtonStyle.Success)
		.setLabel("Yes");

	const noButton = new ButtonBuilder()
		.setCustomId("no")
		.setEmoji(EMOJIS.X)
		.setStyle(noStyle ?? ButtonStyle.Danger)
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

	const response = await message
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: time ?? 60_000,
			filter
		})
		.catch(() => null);

	await response?.deferUpdate();

	return response?.customId === "yes";
}
