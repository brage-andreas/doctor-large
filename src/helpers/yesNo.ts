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

export default async function yesNo(
	medium: Exclude<Interaction, AutocompleteInteraction> | Message,
	data: Exclude<MessageEditOptions, "Components">,
	filter: (interaction: ButtonInteraction) => boolean,
	options?: {
		yesStyle?: ButtonStyle;
		noStyle?: ButtonStyle;
		time?: number;
	}
) {
	const yesButton = new ButtonBuilder()
		.setCustomId("yes")
		.setStyle(options?.yesStyle ?? ButtonStyle.Success)
		.setLabel("Yes");

	const noButton = new ButtonBuilder()
		.setCustomId("no")
		.setStyle(options?.noStyle ?? ButtonStyle.Danger)
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
			time: options?.time ?? 60_000,
			filter
		})
		.catch(() => null);

	return response?.customId === "yes";
}
