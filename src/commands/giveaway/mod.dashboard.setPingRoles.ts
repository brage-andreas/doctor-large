import { stripIndents } from "common-tags";
import {
	ActionRowBuilder,
	RoleSelectMenuBuilder,
	type ButtonBuilder,
	type ButtonInteraction
} from "discord.js";
import { giveawayComponents } from "../../components/index.js";
import type GiveawayManager from "../../database/giveaway.js";
import { listify } from "../../helpers/listify.js";
import toDashboard from "./mod.dashboard.js";

export default async function toSetPingRoles(
	interaction: ButtonInteraction<"cached">,
	giveawayId: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(giveawayId);

	if (!giveaway) {
		return;
	}

	const pingRolesSelect = new RoleSelectMenuBuilder()
		.setCustomId("pingRolesSelect")
		.setMinValues(1)
		.setMaxValues(10);

	const choosePingRoleStr = stripIndents`
			Select the roles you want to ping when publishing the giveaway.
			
			Currently set to: ${
				giveaway.rolesToPing.length
					? listify(
							giveaway.rolesToPing.map(
								(roleId) => `<@&${roleId}>`
							),
							{ length: 5 }
					  )
					: "No roles"
			}
		`;

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		pingRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		giveawayComponents.dashboard.backButton(),
		giveawayComponents.dashboard.clearPingRolesButton()
	);

	const updateMsg = await interaction.editReply({
		content: choosePingRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	if (component.customId === "back") {
		await component.deferUpdate();

		toDashboard(interaction, giveawayId);

		return;
	}

	if (component.customId === "pingRolesSelect") {
		if (!component.isRoleSelectMenu()) {
			return;
		}

		await component.deferUpdate();

		await giveawayManager.edit({
			where: {
				giveawayId: giveaway.giveawayId
			},
			data: {
				rolesToPing: component.values
			}
		});
	} else if (component.customId === "clearPingRoles") {
		await component.deferUpdate();

		await giveawayManager.edit({
			where: {
				giveawayId: giveaway.giveawayId
			},
			data: {
				rolesToPing: []
			}
		});
	}

	await toDashboard(interaction, giveawayId);
}
