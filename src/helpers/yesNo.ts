import components from "#components";
import { Emojis } from "#constants";
import {
	ActionRowBuilder,
	ButtonStyle,
	ComponentType,
	Message,
	type AutocompleteInteraction,
	type ButtonBuilder,
	type ButtonInteraction,
	type ContextMenuCommandInteraction,
	type Interaction,
	type MessageEditOptions
} from "discord.js";

/**
 * `noStyle` = ButtonStyle.Primary
 *
 * `respondToIgnore` = true
 *
 * `timeActive` = 60_000
 *
 * `yesStyle` = ButtonStyle.Primary
 *
 * `filter` = (i) => i.user.id === medium.user.id
 */
export default async function yesNo(options: {
	respondToIgnore?: boolean;
	timeActive?: number;
	yesStyle?: ButtonStyle;
	noStyle?: ButtonStyle;
	medium:
		| ContextMenuCommandInteraction<"cached">
		| Exclude<Interaction<"cached">, AutocompleteInteraction>
		| Message<true>;
	data: Exclude<MessageEditOptions, "Components">;
	filter?(interaction: ButtonInteraction): boolean;
}): Promise<boolean> {
	const { medium, data } = options;

	const defaultFilter = (i: ButtonInteraction<"cached">) =>
		i.user.id === ("user" in medium ? medium.user.id : medium.author.id);

	const respondToIgnore = options.respondToIgnore ?? true;
	const yesStyle = options.yesStyle ?? ButtonStyle.Primary;
	const noStyle = options.noStyle ?? ButtonStyle.Primary;
	const filter = options.filter ?? defaultFilter;
	const time = options.timeActive ?? 60_000;

	const { yes, no } = components.buttons;

	const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
		yes.component(yesStyle),
		no.component(noStyle)
	);

	let message: Message<true>;

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
						content: `${Emojis.NoEntry} This button is not for you.`,
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
