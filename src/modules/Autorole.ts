import {
	type Client,
	EmbedBuilder,
	type Guild,
	type GuildMember,
	PermissionFlagsBits,
	type Role,
	bold,
} from "discord.js";
import type AutoroleManager from "#database/autorole.js";
import { type Autorole } from "@prisma/client";
import { Colors, Emojis } from "#constants";
import { stripIndents } from "common-tags";

export default class AutoroleModule {
	public activated: boolean;
	public readonly client: Client<true>;
	public data: Autorole;
	public readonly guild: Guild;

	public lastEditedAt: Date | null;
	public readonly manager: AutoroleManager;
	public roleIds: Set<string>;

	public roles: Array<Role | string>;
	public validRoles: Array<Role>;

	public constructor(data: Autorole, guild: Guild, autoroleManager: AutoroleManager) {
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

	public async giveRolesTo(member: GuildMember) {
		return await member.roles.add(this.validRoles, "Autorole").catch(() => null);
	}

	public async setRoles(roles: Array<Role | string>) {
		const roleIds = roles.map((r) => (typeof r === "string" ? r : r.id));

		await this.manager.update({ roleIds });
	}

	public toEmbed() {
		const description = this.activated
			? `${Emojis.On} Currently toggled ${bold("on")}`
			: `${Emojis.Off} Currently toggled ${bold("off")}`;

		const roles =
			this.roleIds.size > 0
				? this.roles
						.map((role, index) => {
							if (typeof role === "string") {
								return `${Emojis.Warn} Could not find role <@${role}> (${role})`;
							}

							return `${index + 1}. ${role.toString()} (${role.id})`;
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

					${this.hasPerms ? "" : `${Emojis.Error} Missing Manage Roles permission`}
				`
			);

		if (this.activated) {
			embed.addFields({
				inline: true,
				name: `Current roles (${this.roleIds.size})`,
				value: roles,
			});
		}

		return embed;
	}

	public async toggle() {
		const activated = !this.activated;

		await this.manager.update({ activated });

		this.data.activated = activated;
		this.activated = activated;

		return activated;
	}

	public get hasPerms() {
		return this.guild.members.me?.permissions.has(PermissionFlagsBits.ManageRoles) ?? false;
	}
}
