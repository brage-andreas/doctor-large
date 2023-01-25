import {
	ActionRowBuilder,
	ButtonStyle,
	ComponentType,
	Message,
	type AutocompleteInteraction,
	type ButtonBuilder,
	type ButtonInteraction,
	type Interaction,
	type MessageEditOptions
} from "discord.js";
import components from "../components/index.js";
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

	const { yes, no } = components.buttons;

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		yes.component(yesStyle),
		no.component(noStyle)
	);

	const method = medium instanceof Message ? medium.edit : medium.editReply;
	const message = await method({ ...data, components: [row] });

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

			if (collectedInteraction.customId === yes.customId) {
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
