import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	RoleSelectMenuBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import { giveawayComponents } from "../../../components/index.js";
import type GiveawayManager from "../../../database/giveaway.js";
import lastEditBy from "../../../helpers/lastEdit.js";
import { listify } from "../../../helpers/listify.js";
import Logger from "../../../logger/logger.js";
import toDashboard from "../mod.dashboard.js";

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
				giveaway.requiredRolesIds.length
					? listify(
							giveaway.requiredRolesIds.map(
								(roleId) => `<@&${roleId}>`
							),
							{ length: 5 }
					  )
					: "No roles"
			}
		`;

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		requiredRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton(),
		giveawayComponents.dashboard.clearRequiredRolesButton()
	);

	const updateMsg = await interaction.editReply({
		content: chooseRequiredRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	if (component.customId === "back") {
		await component.deferUpdate();

		toDashboard(interaction, id);

		return;
	}

	if (component.customId === "requiredRolesSelect") {
		if (!component.isRoleSelectMenu()) {
			return;
		}

		await component.deferUpdate();

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Edited required roles of giveaway #${giveaway.id}`
		);

		await giveawayManager.edit({
			where: {
				id: giveaway.id
			},
			data: {
				requiredRolesIds: component.values,
				...lastEditBy(interaction.user)
			}
		});
	} else if (component.customId === "clearRequiredRoles") {
		await component.deferUpdate();

		new Logger({ prefix: "GIVEAWAY", interaction }).log(
			`Cleared required roles of giveaway #${giveaway.id}`
		);

		await giveawayManager.edit({
			where: {
				id: giveaway.id
			},
			data: {
				requiredRolesIds: [],
				...lastEditBy(interaction.user)
			}
		});
	}

	await toDashboard(interaction, id);
}
