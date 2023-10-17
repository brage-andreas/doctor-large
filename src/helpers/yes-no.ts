import {
	type AutocompleteInteraction,
	type ButtonInteraction,
	ButtonStyle,
	ComponentType,
	type ContextMenuCommandInteraction,
	type Interaction,
	Message,
	type MessageEditOptions,
} from "discord.js";
import { type CustomIdCompatibleButtonStyle } from "#typings";
import components from "#discord-components";
import { Emojis } from "#constants";

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
	data: Exclude<MessageEditOptions, "Components">;
	filter?(interaction: ButtonInteraction): boolean;
	medium:
		| ContextMenuCommandInteraction<"cached">
		| Exclude<Interaction<"cached">, AutocompleteInteraction>
		| Message<true>;
	noStyle?: CustomIdCompatibleButtonStyle;
	respondToIgnore?: boolean;
	timeActive?: number;
	yesStyle?: CustomIdCompatibleButtonStyle;
}): Promise<boolean> {
	const { data, medium, timeActive } = options;

	const defaultFilter = (index: ButtonInteraction<"cached">) =>
		index.user.id === ("user" in medium ? medium.user.id : medium.author.id);

	const respondToIgnore = options.respondToIgnore ?? true;
	const yesStyle = options.yesStyle ?? ButtonStyle.Primary;
	const noStyle = options.noStyle ?? ButtonStyle.Primary;
	const time = timeActive ?? 60_000;

	const { filter } = options.filter ? options : { filter: defaultFilter }; // preserves class scope

	const rows = components.createRows(
		components.buttons.yes.component(yesStyle),
		components.buttons.no.component(noStyle)
	);

	const message = await (medium instanceof Message
		? medium.edit({ ...data, components: rows })
		: medium.editReply({ ...data, components: rows }));

	return new Promise<void>((resolve, reject) => {
		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			filter,
			max: 1,
			time,
		});

		if (respondToIgnore) {
			collector.on("ignore", (interaction) => {
				interaction
					.reply({
						content: `${Emojis.NoEntry} This button is not for you.`,
						ephemeral: true,
					})
					.catch(() => null);
			});
		}

		collector.on("collect", async (interaction) => {
			await interaction.deferUpdate().catch(() => null);

			if (interaction.customId === components.buttons.yes.customId) {
				resolve();
			} else {
				reject();
			}
		});

		collector.on("end", (collected) => {
			if (collected.size === 0) {
				reject();
			}
		});
	})
		.then(() => true)
		.catch(() => false);
}
