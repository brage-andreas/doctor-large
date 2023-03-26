import components from "#components";
import type GiveawayManager from "#database/giveaway.js";
import { listify } from "#helpers/listify.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
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

	const chooseRequiredRoleStr = stripIndents`
			Select the roles you require entrants to have.
			
			Currently set to: ${
				giveaway.requiredRolesMentions?.length
					? listify(giveaway.requiredRolesMentions, { length: 5 })
					: "No roles"
			}
		`;

	const rows = components.createRows(
		components.selectMenus.role,
		components.buttons.back,
		components.buttons.clear
	);

	const updateMsg = await interaction.editReply({
		content: chooseRequiredRoleStr,
		components: rows
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	await component.deferUpdate();

	switch (component.customId) {
		case components.buttons.back.customId: {
			break;
		}

		case components.buttons.clear.customId: {
			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Cleared required roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit({
				requiredRolesIds: [],
				nowOutdated: {
					announcementMessage: true
				}
			});

			break;
		}

		case components.selectMenus.role.customId: {
			if (!component.isRoleSelectMenu()) {
				return;
			}

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Edited required roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit({
				requiredRolesIds: component.values,
				nowOutdated: {
					announcementMessage: true
				}
			});

			break;
		}
	}

	await toDashboard(interaction, id);
}
