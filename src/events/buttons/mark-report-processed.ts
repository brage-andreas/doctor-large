import { type ButtonInteraction } from "discord.js";
import ReportManager from "#database/report.js";
import { Emojis, Regex } from "#constants";
import { oneLine } from "common-tags";
import Logger from "#logger";

export default async function markReportProcessed(interaction: ButtonInteraction<"cached">) {
	const match = interaction.customId.match(Regex.MarkReportProcessed);
	const reportId = match?.groups?.id ? Number(match.groups.id) : undefined;

	if (!reportId) {
		await interaction.reply({
			content: `${Emojis.Error} This button is faulty.`,
			ephemeral: true,
		});

		return;
	}

	await interaction.deferReply({ ephemeral: true });

	const reportManager = new ReportManager(interaction.guild);
	const report = await reportManager.get(reportId);

	if (!report) {
		await interaction.editReply({
			content: `${Emojis.Error} This report no longer exists.`,
		});

		return;
	}

	const dataEditedSuccess = await report
		.edit({
			processedAt: interaction.createdAt,
			processedByUserId: interaction.user.id,
			processedByUsername: interaction.user.tag,
		})
		.then(() => true)
		.catch(() => false);

	if (!dataEditedSuccess) {
		await interaction.editReply({
			content: oneLine`
				${Emojis.Error} Something went wrong marking this report processed.
				Check if the report still exists and try again.
			`,
		});

		return;
	}

	const logEditedSuccess = await report.editLog();

	new Logger({
		color: "grey",
		interaction,
		label: "REPORT",
	}).log(`Marked report #${report.id} processed`);

	if (!logEditedSuccess) {
		await interaction.editReply({
			content: `${Emojis.Warn} Could not update the report log, but the report has been marked processed.`,
		});

		return;
	}

	await interaction.editReply({
		content: `${Emojis.Check} Marked report processed.`,
	});
}
