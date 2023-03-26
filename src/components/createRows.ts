import {
	ActionRowBuilder,
	ComponentType,
	type ButtonBuilder,
	type ChannelSelectMenuBuilder,
	type MentionableSelectMenuBuilder,
	type RoleSelectMenuBuilder,
	type StringSelectMenuBuilder,
	type UserSelectMenuBuilder
} from "discord.js";

interface ComponentObject {
	readonly customId?: string;
	component(): CompatibleComponentBuilder;
}

type CompatibleComponentBuilder =
	| ButtonBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder
	| RoleSelectMenuBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder;

type CompatibleActionRow =
	| ActionRowBuilder<ButtonBuilder>
	| ActionRowBuilder<ChannelSelectMenuBuilder>
	| ActionRowBuilder<MentionableSelectMenuBuilder>
	| ActionRowBuilder<RoleSelectMenuBuilder>
	| ActionRowBuilder<StringSelectMenuBuilder>
	| ActionRowBuilder<UserSelectMenuBuilder>;

export const createRows = (
	...components: Array<
		CompatibleComponentBuilder | ComponentObject | null | undefined
	>
): Array<CompatibleActionRow> => {
	const rows: Array<CompatibleActionRow> = [];

	for (const componentOrObject of components) {
		if (!componentOrObject) {
			continue;
		}

		const component =
			"component" in componentOrObject
				? componentOrObject.component()
				: componentOrObject;

		if (!component.data.type) {
			continue;
		}

		switch (component.data.type) {
			case ComponentType.Button: {
				let last = rows.at(-1) ?? new ActionRowBuilder<ButtonBuilder>();

				if (
					last.components.some(
						(c) => c.data.type !== ComponentType.Button
					)
				) {
					last = new ActionRowBuilder<ButtonBuilder>();
				} else if (last.components.length) {
					rows.pop();
				}

				last = last as ActionRowBuilder<ButtonBuilder>;

				if (last.components.length === 5) {
					const newRow =
						new ActionRowBuilder<ButtonBuilder>().setComponents(
							component as ButtonBuilder
						);

					rows.push(newRow);
				} else {
					last.addComponents(component as ButtonBuilder);

					rows.push(last);
				}

				break;
			}

			case ComponentType.ChannelSelect: {
				rows.push(
					new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
						component as ChannelSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.MentionableSelect: {
				rows.push(
					new ActionRowBuilder<MentionableSelectMenuBuilder>().setComponents(
						component as MentionableSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.RoleSelect: {
				rows.push(
					new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
						component as RoleSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.StringSelect: {
				rows.push(
					new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
						component as StringSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.UserSelect: {
				rows.push(
					new ActionRowBuilder<UserSelectMenuBuilder>().setComponents(
						component as UserSelectMenuBuilder
					)
				);

				break;
			}
		}
	}

	return rows.slice(0, 5);
};
