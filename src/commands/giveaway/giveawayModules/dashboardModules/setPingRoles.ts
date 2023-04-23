import components from "#components";
import type GiveawayManager from "#database/giveaway.js";
import { listify } from "#helpers/listify.js";
import Logger from "#logger";
import { stripIndents } from "common-tags";
import { type ButtonInteraction } from "discord.js";
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
			Select the roles you want to ping when announcing the giveaway.
			
			Currently set to: ${
				giveaway.pingRolesMentions?.length
					? listify(giveaway.pingRolesMentions, { length: 5 })
					: "No roles"
			}
		`;

	const rows = components.createRows(
		components.selectMenus.role,
		components.buttons.back,
		components.buttons.clear,
		components.buttons.setPingRolesToAtEveryone
	);

	const updateMsg = await interaction.editReply({
		content: choosePingRoleStr,
		components: rows
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	switch (component.customId) {
		case components.buttons.back.customId: {
			break;
		}

		case components.buttons.setPingRolesToAtEveryone.customId: {
			await component.deferUpdate();

			new Logger({ label: "GIVEAWAY", interaction }).log(
				`Set ping roles of giveaway #${giveaway.id} to @everyone`
			);

			await giveaway.edit({
				pingRolesIds: [interaction.guild.roles.everyone.id],
				nowOutdated: {
					announcementMessage: true
				}
			});

			break;
		}

		case components.buttons.clear.customId: {
			await component.deferUpdate();

			new Logger({ label: "GIVEAWAY", interaction }).log(
				`Cleared ping roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit({
				pingRolesIds: [],
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

			await component.deferUpdate();

			new Logger({ label: "GIVEAWAY", interaction }).log(
				`Edited ping roles of giveaway #${giveaway.id}`
			);

			await giveaway.edit({
				pingRolesIds: component.values,
				nowOutdated: {
					announcementMessage: true
				}
			});

			break;
		}
	}

	await toDashboard(interaction, id);
}
