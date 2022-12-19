import { type autorole } from "@prisma/client";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type ChatInputCommandInteraction
} from "discord.js";
import { EMOJIS } from "../../constants.js";

export default function formatAutorole(
	interaction: ChatInputCommandInteraction<"cached">,
	autorole: autorole | null
) {
	const hasManageRolesPermission =
		interaction.guild.members.me?.permissions.has(
			PermissionFlagsBits.ManageRoles
		) ?? false;

	const description = autorole?.activated
		? `${EMOJIS.ON} Currently toggled **on**`
		: `${EMOJIS.OFF} Currently toggled **off**`;

	const roles = autorole?.roleIds.length
		? autorole.roleIds
				.map((roleId, i) => {
					const role = interaction.guild.roles.cache.get(roleId);

					if (!role) {
						return `⚠️ Could not find role (${roleId})`;
					}

					return `${i + 1}. ${role} (${role.id})`;
				})
				.join("\n")
		: "No roles";

	const embed = new EmbedBuilder()
		.setTitle("Autorole")
		.setDescription(
			hasManageRolesPermission
				? description
				: `${description}\n\n⚠️ Missing Manage Roles permission`
		)
		.setTimestamp(
			autorole?.discordTimestamp
				? Number(autorole.discordTimestamp)
				: undefined
		);

	if (autorole?.moderatorTag && autorole.moderatorId) {
		embed.setFooter({
			text: `Last edited by ${autorole.moderatorTag} (${autorole.moderatorId})`
		});
	}

	if (autorole?.activated) {
		embed.addFields({
			name: "Current roles",
			value: roles,
			inline: true
		});
	}

	return embed;
}
