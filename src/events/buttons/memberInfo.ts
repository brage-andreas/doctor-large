import { ColorsHex, Emojis, Regex } from "#constants";
import getMemberInfo from "#helpers/memberInfo.js";
import Logger from "#logger";
import { type APIEmbed, type ButtonInteraction } from "discord.js";

export default async function memberInfo(
	interaction: ButtonInteraction<"cached">
) {
	await interaction.deferReply({ ephemeral: true });

	const match = interaction.customId.match(Regex.MemberInfoCustomId);
	const memberId = match?.groups?.id;
	const prefix = match?.groups?.prefix;

	if (!memberId || !prefix) {
		await interaction.editReply({
			content: `${Emojis.Error} This button is faulty.`
		});

		return;
	}

	const memberOrUser = await interaction.guild.members
		.fetch({
			user: memberId,
			force: true
		})
		.catch(
			async () =>
				await interaction.client.users
					.fetch(memberId, { force: true })
					.catch(() => null)
		);

	if (!memberOrUser) {
		await interaction.editReply({
			content: `${Emojis.Error} This button is faulty, as the user no longer exist.\nID: \`${memberId}\``
		});

		return;
	}

	const embed: APIEmbed = {
		color: ColorsHex.Yellow,
		fields: getMemberInfo(memberOrUser, prefix),
		thumbnail: { url: memberOrUser.displayAvatarURL({ size: 1024 }) },
		timestamp: new Date().toISOString()
	};

	new Logger({ color: "grey", prefix: "REPORT", interaction }).log(
		`Opened member info of ${memberId} from button`
	);

	await interaction.editReply({
		content: null,
		embeds: [embed]
	});
}
