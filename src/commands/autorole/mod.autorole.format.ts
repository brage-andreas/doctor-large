import { type Autorole } from "@prisma/client";
import { oneLine } from "common-tags";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type ChatInputCommandInteraction
} from "discord.js";
import { EMOJIS } from "../../constants.js";

export default function formatAutorole(
	interaction: ChatInputCommandInteraction<"cached">,
	autorole: Autorole | null
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
			autorole?.lastEditedTimestamp
				? Number(autorole.lastEditedTimestamp)
				: undefined
		);

	if (autorole?.lastEditedUserTag && autorole.lastEditedUserId) {
		embed.setFooter({
			text: oneLine`
				Last edited by ${autorole.lastEditedUserTag}
				(${autorole.lastEditedUserId})
			`
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
