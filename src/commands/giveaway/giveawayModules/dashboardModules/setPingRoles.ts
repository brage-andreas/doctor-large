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

	const { back, clear, setPingRolesToAtEveryone } = components.buttons;
	const { roleSelect } = components.selects;

	const rows = components.createRows(
		roleSelect,
		back,
		clear,
		setPingRolesToAtEveryone
	);

	const updateMsg = await interaction.editReply({
		content: choosePingRoleStr,
		components: rows
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
					announcementMessage: true
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
					announcementMessage: true
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
					announcementMessage: true
				}
			});

			break;
		}
	}

	await toDashboard(interaction, id);
}
