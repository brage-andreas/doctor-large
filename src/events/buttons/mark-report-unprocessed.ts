import { type ButtonInteraction } from "discord.js";
import ReportManager from "#database/report.js";
import { Emojis, Regex } from "#constants";
import { oneLine } from "common-tags";
import Logger from "#logger";

export default async function markReportUnprocessed(interaction: ButtonInteraction<"cached">) {
	const match = interaction.customId.match(Regex.MarkReportUnprocessed);
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
			processedAt: null,
			processedByUserId: null,
			processedByUsername: null,
			referencedBy: { set: [] },
		})
		.then(() => true)
		.catch(() => false);

	if (!dataEditedSuccess) {
		await interaction.editReply({
			content: oneLine`
				${Emojis.Error} Something went wrong marking this report unprocessed.
				Check if it still exists and try again.
			`,
		});

		return;
	}

	const logEditedSuccess = await report.editLog();

	new Logger({
		color: "grey",
		interaction,
		label: "REPORT",
	}).log(`Marked report #${report.id} unprocessed`);

	if (!logEditedSuccess) {
		await interaction.editReply({
			content: `${Emojis.Warn} Could not update the report log, but the report has been marked unprocessed.`,
		});

		return;
	}

	await interaction.editReply({
		content: `${Emojis.Check} Marked report unprocessed.`,
	});
}
