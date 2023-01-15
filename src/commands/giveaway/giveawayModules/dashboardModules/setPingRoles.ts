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

export default async function toSetPingRoles(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

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
				giveaway.pingRolesIds.size
					? listify(giveaway.pingRolesMentions!, { length: 5 })
					: "No roles"
			}
		`;

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		pingRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		components.buttons.back(),
		components.buttons.clearPingRoles(),
		components.buttons.setPingRolesToAtEveryone()
	);

	const updateMsg = await interaction.editReply({
		content: choosePingRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	switch (component.customId) {
		case "back": {
			break;
		}

		case "setPingRolesToAtEveryone": {
			await component.deferUpdate();

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Set ping roles of giveaway #${giveaway.id} to @everyone`
			);

			await giveaway.edit(
				{
					pingRolesIds: [interaction.guild.roles.everyone.id]
				},
				{
					nowOutdated: {
						publishedMessage: true
					}
				}
			);

			break;
		}

		case "clearPingRoles": {
			await component.deferUpdate();

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Cleared ping roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit(
				{
					pingRolesIds: []
				},
				{
					nowOutdated: {
						publishedMessage: true
					}
				}
			);

			break;
		}

		case "pingRolesSelect": {
			if (!component.isRoleSelectMenu()) {
				return;
			}

			await component.deferUpdate();

			new Logger({ prefix: "GIVEAWAY", interaction }).log(
				`Edited ping roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit(
				{
					pingRolesIds: component.values
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
