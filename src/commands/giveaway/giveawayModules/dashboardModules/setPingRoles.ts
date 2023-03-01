import components from "#components";
import type GiveawayManager from "#database/giveaway.js";
import { listify } from "#helpers/listify.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	type ButtonBuilder,
	type ButtonInteraction,
	type RoleSelectMenuBuilder
} from "discord.js";
import toDashboard from "../dashboard.js";

export default async function toSetPingRoles(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const choosePingRoleStr = stripIndents`
			Select the roles you want to ping when publishing the giveaway.
			
			Currently set to: ${
				giveaway.pingRolesIds.size
					? listify(giveaway.pingRolesMentions!, { length: 5 })
					: "No roles"
			}
		`;

	const { back, clear, setPingRolesToAtEveryone } = components.buttons;
	const { roleSelect } = components.selects;

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		roleSelect.component(1, 10)
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		back.component(),
		clear.component(),
		setPingRolesToAtEveryone.component()
	);

	const updateMsg = await interaction.editReply({
		content: choosePingRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	switch (component.customId) {
		case back.customId: {
			break;
		}

		case setPingRolesToAtEveryone.customId: {
			await component.deferUpdate();

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Set ping roles of giveaway #${giveaway.id} to @everyone`
			);

			await giveaway.edit({
				pingRolesIds: [interaction.guild.roles.everyone.id],
				nowOutdated: {
					publishedMessage: true
				}
			});

			break;
		}

		case clear.customId: {
			await component.deferUpdate();

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Cleared ping roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit({
				pingRolesIds: [],
				nowOutdated: {
					publishedMessage: true
				}
			});

			break;
		}

		case roleSelect.customId: {
			if (!component.isRoleSelectMenu()) {
				return;
			}

			await component.deferUpdate();

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Edited ping roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit({
				pingRolesIds: component.values,
				nowOutdated: {
					publishedMessage: true
				}
			});

			break;
		}
	}

	await toDashboard(interaction, id);
}
