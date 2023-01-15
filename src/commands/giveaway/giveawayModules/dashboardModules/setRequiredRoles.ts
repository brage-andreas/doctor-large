import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	RoleSelectMenuBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import components from "../../../../components/index.js";
import type GiveawayManager from "../../../../database/giveaway.js";
import { listify } from "../../../../helpers/listify.js";
import Logger from "../../../../logger/logger.js";
import toDashboard from "../dashboard.js";

export default async function toSetRequiredRoles(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const requiredRolesSelect = new RoleSelectMenuBuilder()
		.setCustomId("requiredRolesSelect")
		.setMinValues(1)
		.setMaxValues(10);

	const chooseRequiredRoleStr = stripIndents`
			Select the roles you require entrants to have.
			
			Currently set to: ${
				giveaway.requiredRolesIds.size
					? listify(giveaway.requiredRolesMentions!, { length: 5 })
					: "No roles"
			}
		`;

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		requiredRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		components.buttons.back(),
		components.buttons.clearRequiredRoles()
	);

	const updateMsg = await interaction.editReply({
		content: chooseRequiredRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	await component.deferUpdate();

	switch (component.customId) {
		case "back": {
			break;
		}

		case "requiredRolesSelect": {
			if (!component.isRoleSelectMenu()) {
				return;
			}

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Edited required roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit(
				{
					requiredRolesIds: component.values
				},
				{
					nowOutdated: {
						publishedMessage: true
					}
				}
			);

			break;
		}

		case "clearRequiredRoles": {
			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Cleared required roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit(
				{
					requiredRolesIds: []
				},
				{
					nowOutdated: {
						publishedMessage: true
					}
				}
			);

			break;
		}
	}

	await toDashboard(interaction, id);
}
