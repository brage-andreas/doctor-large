import { Colors, Emojis } from "#constants";
import type AutoroleManager from "#database/autorole.js";
import { type Autorole } from "@prisma/client";
import { stripIndents } from "common-tags";
import {
	EmbedBuilder,
	PermissionFlagsBits,
	type Client,
	type Guild,
	type GuildMember,
	type Role
} from "discord.js";

export default class AutoroleModule {
	public readonly manager: AutoroleManager;
	public readonly client: Client<true>;
	public readonly guild: Guild;
	public data: Autorole;

	public activated: boolean;
	public lastEditedAt: Date | null;
	public roleIds: Set<string>;

	public roles: Array<Role | string>;
	public validRoles: Array<Role>;

	public constructor(
		data: Autorole,
		guild: Guild,
		autoroleManager: AutoroleManager
	) {
		this.manager = autoroleManager;
		this.client = guild.client;
		this.guild = guild;
		this.data = data;

		this.activated = data.activated;
		this.lastEditedAt = data.lastEditedAt;
		this.roleIds = new Set(data.roleIds);

		this.validRoles = [];
		this.roles = data.roleIds.map((roleId) => {
			const role = guild.roles.cache.get(roleId);

			if (!role) {
				return roleId;
			}

			this.validRoles.push(role);

			return role;
		});
	}

	public get hasPerms() {
		return (
			this.guild.members.me?.permissions.has(
				PermissionFlagsBits.ManageRoles
			) ?? false
		);
	}

	public async giveRolesTo(member: GuildMember) {
		return await member.roles
			.add(this.validRoles, "Autorole")
			.catch(() => null);
	}

	public async toggle() {
		const activated = !this.activated;

		await this.manager.update({ activated });

		this.data.activated = activated;
		this.activated = activated;

		return activated;
	}

	public async setRoles(roles: Array<Role | string>) {
		const roleIds = roles.map((r) => (typeof r === "string" ? r : r.id));

		await this.manager.update({ roleIds });
	}

	public toEmbed() {
		const description = this.activated
			? `${Emojis.On} Currently toggled **on**`
			: `${Emojis.Off} Currently toggled **off**`;

		const roles = this.roleIds.size
			? this.roles
					.map((role, i) => {
						if (typeof role === "string") {
							return `${Emojis.Warn} Could not find role <@${role}> (${role})`;
						}

						return `${i + 1}. ${role} (${role.id})`;
					})
					.join("\n")
			: "No roles";

		const embed = new EmbedBuilder()
			.setTimestamp(this.lastEditedAt)
			.setColor(this.activated ? Colors.Green : Colors.Red)
			.setTitle("Autorole")
			.setDescription(
				stripIndents`
					${description}

					${!this.hasPerms ? `${Emojis.Error} Missing Manage Roles permission` : ""}
				`
			);

		if (this.activated) {
			embed.addFields({
				name: `Current roles (${roles.length})`,
				value: roles,
				inline: true
			});
		}

		return embed;
	}
}
