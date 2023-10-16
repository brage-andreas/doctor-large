import type GiveawayManager from "#database/giveaway.js";
import { type ButtonInteraction } from "discord.js";
import { stripIndents } from "common-tags";
import toDashboard from "../dashboard.js";
import components from "#components";
import { listify } from "#helpers";
import Logger from "#logger";

export default async function toSetPingRoles(
	interaction: ButtonInteraction<"cached">,
	id: number,
	giveawayManager: GiveawayManager
) {
	const giveaway = await giveawayManager.get(id);

	if (!giveaway) {
		return;
	}

	const choosePingRoleString = stripIndents`
			Select the roles you want to ping when announcing the giveaway.
			
			Currently set to: ${
				giveaway.pingRolesMentions?.length ? listify(giveaway.pingRolesMentions, { length: 5 }) : "No roles"
			}
		`;

	const rows = components.createRows(
		components.selectMenus.role,
		components.buttons.back,
		components.buttons.clear,
		components.buttons.setPingRolesToAtEveryone
	);

	const updateMessage = await interaction.editReply({
		components: rows,
		content: choosePingRoleString,
	});

	const component = await updateMessage.awaitMessageComponent({
		filter: (index) => index.user.id === interaction.user.id,
	});

	switch (component.customId) {
		case components.buttons.back.customId: {
			break;
		}

		case components.buttons.setPingRolesToAtEveryone.customId: {
			await component.deferUpdate();

			new Logger({ interaction, label: "GIVEAWAY" }).log(
				`Set ping roles of giveaway #${giveaway.id} to @everyone`
			);

			await giveaway.edit({
				nowOutdated: {
					announcementMessage: true,
				},
				pingRolesIds: [interaction.guild.roles.everyone.id],
			});

			break;
		}

		case components.buttons.clear.customId: {
			await component.deferUpdate();

			new Logger({ interaction, label: "GIVEAWAY" }).log(`Cleared ping roles of giveaway #${giveaway.id}`);

			await giveaway.edit({
				nowOutdated: {
					announcementMessage: true,
				},
				pingRolesIds: [],
			});

			break;
		}

		case components.selectMenus.role.customId: {
			if (!component.isRoleSelectMenu()) {
				return;
			}

			await component.deferUpdate();

			new Logger({ interaction, label: "GIVEAWAY" }).log(`Edited ping roles of giveaway #${giveaway.id}`);

			await giveaway.edit({
				nowOutdated: {
					announcementMessage: true,
				},
				pingRolesIds: component.values,
			});

			break;
		}
	}

	await toDashboard(interaction, id);
}
