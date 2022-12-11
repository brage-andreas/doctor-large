import { ButtonInteraction } from "discord.js";

export default function (i: ButtonInteraction<"cached">) {
	if (!i.replied) {
		await i.deferUpdate().catch(console.error);
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

	const clearPingRolesButton =
		giveawayComponents.dashboard.clearPingRolesButton();

	const row1 = new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
		pingRolesSelect
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		clearPingRolesButton
	);

	const updateMsg = await i.editReply({
		content: choosePingRoleStr,
		components: [row1, row2]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

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
	} else if (component.customId === "clearRequiredRoles") {
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

	await dashboard(interaction, giveawayManager, id);

	return;
}
