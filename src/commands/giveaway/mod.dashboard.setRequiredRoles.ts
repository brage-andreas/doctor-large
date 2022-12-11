import { ButtonInteraction } from "discord.js";

export default function (i: ButtonInteraction<"cached">) {
	if (!i.replied) {
		await i.deferUpdate().catch(console.error);
	}

	const requiredRolesSelect = new RoleSelectMenuBuilder()
		.setCustomId("requiredRolesSelect")
		.setMinValues(1)
		.setMaxValues(10);

	const chooseRequiredRoleStr = stripIndents`
			Select the roles you require entrants to have.
			
			Currently set to: ${
				giveaway.requiredRoles.length
					? listify(
							giveaway.requiredRoles.map(
								(roleId) => `<@&${roleId}>`
							),
							{ length: 5 }
					  )
					: "No roles"
			}
		`;

	const clearRequiredRolesButton =
		giveawayComponents.dashboard.clearRequiredRolesButton();

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		requiredRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		clearRequiredRolesButton
	);

	const updateMsg = await i.editReply({
		content: chooseRequiredRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	if (component.customId === "requiredRolesSelect") {
		if (!component.isRoleSelectMenu()) {
			return;
		}

		await component.deferUpdate();

		await giveawayManager.edit({
			where: {
				giveawayId: giveaway.giveawayId
			},
			data: {
				requiredRoles: component.values
			}
		});
	} else if (component.customId === "clearRequiredRoles") {
		await component.deferUpdate();

		await giveawayManager.edit({
			where: {
				giveawayId: giveaway.giveawayId
			},
			data: {
				requiredRoles: []
			}
		});
	}

	await dashboard(interaction, giveawayManager, id);

	return;
}
