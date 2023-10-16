import type GiveawayManager from "#database/giveaway.js";
import { type ButtonInteraction } from "discord.js";
import { stripIndents } from "common-tags";
import toDashboard from "../dashboard.js";
import components from "#components";
import { listify } from "#helpers";
import Logger from "#logger";

export default async function toSetRequiredRoles(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const chooseRequiredRoleString = stripIndents`
			Select the roles you require entrants to have.
			
			Currently set to: ${
				giveaway.requiredRolesMentions?.length
					? listify(giveaway.requiredRolesMentions, { length: 5 })
					: "No roles"
			}
		`;

	const rows = components.createRows(components.selectMenus.role, components.buttons.back, components.buttons.clear);

	const updateMessage = await interaction.editReply({
		components: rows,
		content: chooseRequiredRoleString,
	});

	const component = await updateMessage.awaitMessageComponent({
		filter: (index) => index.user.id === interaction.user.id,
	});

	await component.deferUpdate();

	switch (component.customId) {
		case components.buttons.back.customId: {
			break;
		}

		case components.buttons.clear.customId: {
			new Logger({ interaction, label: "GIVEAWAY" }).log(`Cleared required roles of giveaway #${giveaway.id}`);

			await giveaway.edit({
				nowOutdated: {
					announcementMessage: true,
				},
				requiredRolesIds: [],
			});

			break;
		}

		case components.selectMenus.role.customId: {
			if (!component.isRoleSelectMenu()) {
				return;
			}

			new Logger({ interaction, label: "GIVEAWAY" }).log(`Edited required roles of giveaway #${giveaway.id}`);

			await giveaway.edit({
				nowOutdated: {
					announcementMessage: true,
				},
				requiredRolesIds: component.values,
			});

			break;
		}
	}

	await toDashboard(interaction, id);
}
