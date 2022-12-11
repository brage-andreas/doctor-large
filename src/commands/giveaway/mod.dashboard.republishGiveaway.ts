import { ButtonInteraction } from "discord.js";

export default async function (i: ButtonInteraction<"cached">) {
	if (!i.replied) {
		await i.deferUpdate().catch(console.error);
	}

	const channelSelectMenu = new ChannelSelectMenuBuilder()
		.setCustomId("channelSelect")
		.setMinValues(1)
		.setMaxValues(1)
		.setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement);

	const chooseChannelStr = stripIndents`
			Select the channel you would like to publish the giveaway in.
			
			${
				giveaway.channelId
					? `Previous channel: <#${giveaway.channelId}> (${giveaway.channelId})`
					: ""
			}
		`;

	const lastChannelButton = new ButtonBuilder()
		.setCustomId("lastChannel")
		.setLabel("Use the previous channel")
		.setStyle(ButtonStyle.Primary);

	const row1 = new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
		channelSelectMenu
	);

	const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
		backButton,
		lastChannelButton
	);

	const updateMsg = await i.editReply({
		content: chooseChannelStr,
		components: [row1, row2],
		embeds: [await formatGiveaway(giveaway, true)]
	});

	const component = await updateMsg.awaitMessageComponent({
		filter: (i) => i.user.id === interaction.user.id
	});

	if (component.customId === "back") {
		dashboard(interaction, giveawayManager, id);

		return;
	}

	if (
		component.customId === "channelSelect" ||
		component.customId === "lastChannel"
	) {
		const channelId = !component.isChannelSelectMenu()
			? giveaway.channelId
			: component.values[0];

		if (!channelId) {
			i.editReply({
				content: "⚠️ Something went wrong. Try again.",
				components: [],
				embeds: []
			});

			return;
		}

		const channel = interaction.guild.channels.cache.get(channelId) as
			| NewsChannel
			| TextChannel
			| undefined;

		if (!channel) {
			i.editReply({
				content: "⚠️ This channel does not exist.",
				components: [],
				embeds: []
			});

			return;
		}

		const msg = await channel.send({
			content: giveaway.rolesToPing
				.map((roleId) => `<@&${roleId}>`)
				.join(" "),
			allowedMentions: {
				roles: giveaway.rolesToPing
			},
			embeds: [await formatGiveaway(giveaway, true)],
			components: [
				new ActionRowBuilder<ButtonBuilder>().setComponents(
					enterGiveawayButton
				)
			]
		});

		const oldChannel = i.guild.channels.cache.get(giveaway.channelId ?? "");

		if (oldChannel?.isTextBased() && giveaway.messageId) {
			oldChannel.messages.delete(giveaway.messageId).catch(() => null);
		}

		i.editReply({
			content: `✨ Done! Giveaway published in ${channel}.`,
			components: [],
			embeds: []
		});

		giveawayManager.edit({
			where: {
				giveawayId: giveaway.giveawayId
			},
			data: {
				lastEditedTimestamp: Date.now().toString(),
				lastEditedUserTag: i.user.tag,
				lastEditedUserId: i.user.id,
				messageId: msg.id,
				channelId
			}
		});
	}

	return;
}
