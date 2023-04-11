import { Emojis, Regex } from "#constants";
import { type CustomIdCompatibleButtonStyle } from "#typings";
import {
	ButtonStyle,
	ComponentType,
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithURL,
	type APIMessageComponentEmoji
} from "discord.js";

const formatEmoji = (emoji: string): APIMessageComponentEmoji => {
	if (!emoji.startsWith("<")) {
		return {
			name: emoji
		};
	}

	const match = emoji.match(Regex.Emoji);

	if (!match?.groups) {
		throw new TypeError(
			`Supplied emoji is not unicode nor Discord emoji: ${emoji}`
		);
	}

	const { animated, name, id } = match.groups;

	return { animated: Boolean(animated), id, name };
};

export const announceGiveaway = {
	customId: "announceGiveaway",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "announceGiveaway",
		style: ButtonStyle.Success,
		label: "Announce",
		type: ComponentType.Button
	})
} as const;

export const announcementOptions = {
	customId: "announcementOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "announcementOptions",
		style: ButtonStyle.Success,
		label: "Announcement options",
		type: ComponentType.Button
	})
} as const;

export const lockEntries = {
	customId: "lockEntries",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "lockEntries",
		style: ButtonStyle.Secondary,
		emoji: formatEmoji(Emojis.Lock),
		label: "Lock entries",
		type: ComponentType.Button
	})
} as const;

export const unlockEntries = {
	customId: "unlockEntries",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "unlockEntries",
		emoji: formatEmoji(Emojis.Unlock),
		label: "Unlock entries",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const setRequiredRoles = {
	customId: "setRequiredRoles",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setRequiredRoles",
		style: ButtonStyle.Secondary,
		label: "Set required roles",
		type: ComponentType.Button
	})
} as const;

export const setPingRolesToAtEveryone = {
	customId: "setPingRolesToAtEveryone",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setPingRolesToAtEveryone",
		style: ButtonStyle.Primary,
		label: "Set to @everyone",
		type: ComponentType.Button
	})
} as const;

export const setPingRoles = {
	customId: "setPingRoles",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setPingRoles",
		style: ButtonStyle.Secondary,
		label: "Set ping roles",
		type: ComponentType.Button
	})
} as const;

export const edit = {
	customId: "edit",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "edit",
		style: ButtonStyle.Primary,
		emoji: formatEmoji(Emojis.Edit),
		label: "Edit",
		type: ComponentType.Button
	})
} as const;

export const managePrizes = {
	customId: "managePrizes",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "managePrizes",
		style: ButtonStyle.Success,
		label: "Manage prizes",
		type: ComponentType.Button
	})
} as const;

export const endOptions = {
	customId: "endOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endOptions",
		style: ButtonStyle.Primary,
		label: "End options",
		type: ComponentType.Button
	})
} as const;

export const deleteGiveaway = {
	customId: "deleteGiveaway",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "deleteGiveaway",
		style: ButtonStyle.Danger,
		label: "Delete giveaway",
		type: ComponentType.Button
	})
} as const;

export const lastChannel = {
	customId: "lastChannel",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "lastChannel",
		label: "Use the previous channel",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const editCurrentMessage = {
	customId: "editCurrent",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "editCurrent",
		label: "Edit current message",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const recallCurrentMessage = {
	customId: "recallCurrent",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "recallCurrent",
		label: "Recall current message",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const enterGiveaway = {
	customId: (id: number) => `enter-giveaway-${id}`,
	component: (id: number): APIButtonComponentWithCustomId => ({
		custom_id: `enter-giveaway-${id}`,
		label: "Enter",
		style: ButtonStyle.Success,
		emoji: formatEmoji(Emojis.EnterGiveaway),
		type: ComponentType.Button
	})
} as const;

export const reactivateGiveaway = {
	customId: "reactivateGiveaway",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "reactivateGiveaway",
		label: "Reactivate giveaway",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const announceWinners = {
	customId: "announceWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "announceWinners",
		label: "Announce winners",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const reannounceWinners = {
	customId: "reannounceWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "reannounceWinners",
		label: "Reannounce winners",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const unannounceWinners = {
	customId: "unannounceWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "unannounceWinners",
		label: "Unannounce winners",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const showAllWinners = {
	customId: "showAllWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "showAllWinners",
		label: "Show all winners",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const rollWinners = {
	customId: "rollWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "rollWinners",
		label: "Roll winners",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const rerollWinners = {
	customId: "rerollWinners",
	component: (n: number): APIButtonComponentWithCustomId => ({
		custom_id: "rerollWinners",
		label: `Reroll unclaimed (${n})`,
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const rerollAllWinners = {
	customId: "rerollAllWinners",
	component: (n: number): APIButtonComponentWithCustomId => ({
		custom_id: "rerollAllWinners",
		label: `Reroll all (${n})`,
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const deleteUnclaimedWinners = {
	customId: "deleteUnclaimedWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "deleteUnclaimedWinners",
		label: "Delete unclaimed",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const deleteAllWinners = {
	customId: "deleteAllWinners",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "deleteAllWinners",
		label: "Delete all",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const enable = {
	customId: "enable",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "enable",
		label: "Enable",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const disable = {
	customId: "disable",
	component: (): APIButtonComponentWithCustomId => ({
		label: "Disable",
		custom_id: "disable",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const clear = {
	customId: "clear",
	component: (suffix?: string): APIButtonComponentWithCustomId => ({
		custom_id: "clear",
		label: suffix ? `Clear ${suffix}` : "Clear",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const create = {
	customId: "create",
	component: (suffix?: string): APIButtonComponentWithCustomId => ({
		custom_id: "create",
		label: suffix ? `Create ${suffix}` : "Create",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const back = {
	customId: "back",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "back",
		label: "Back",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const acceptAllPrizes = {
	customId: "acceptAllPrizes",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "acceptAllPrizes",
		emoji: formatEmoji(Emojis.Tada),
		label: "Accept all prizes",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const viewAllEntered = {
	customId: "viewAllEntered",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "viewAllEntered",
		label: "View entered",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const viewAllPrizes = {
	customId: "viewAllPrizes",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "viewAllPrizes",
		label: "View prizes",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const viewAllHosted = {
	customId: "viewAllHosted",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "viewAllHosted",
		label: "View hosted",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const yes = {
	customId: "yes",
	component: (
		style: CustomIdCompatibleButtonStyle
	): APIButtonComponentWithCustomId => ({
		custom_id: "yes",
		emoji: formatEmoji(Emojis.Check),
		style,
		label: "Yes",
		type: ComponentType.Button
	})
} as const;

export const no = {
	customId: "no",
	component: (
		style: CustomIdCompatibleButtonStyle
	): APIButtonComponentWithCustomId => ({
		custom_id: "no",
		emoji: formatEmoji(Emojis.Cross),
		style,
		label: "No",
		type: ComponentType.Button
	})
} as const;

export const resetLevel4 = {
	customId: "resetLevel4",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel4",
		label: "Level 4",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const resetLevel3 = {
	customId: "resetLevel3",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel3",
		label: "Level 3",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const resetLevel2 = {
	customId: "resetLevel2",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel2",
		label: "Level 2",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const resetLevel1 = {
	customId: "resetLevel1",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel1",
		label: "Level 1",
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
} as const;

export const delete_ = {
	customId: "delete",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "delete",
		style: ButtonStyle.Danger,
		label: "Delete",
		type: ComponentType.Button
	})
} as const;

export const endedGiveaway = {
	customId: "giveaway-ended",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "giveaway-ended",
		disabled: true,
		label: "Giveaway has ended!",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const setDate = {
	customId: "setDate",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setDate",
		label: "Set date",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const clearDate = {
	customId: "clearDate",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "clearDate",
		label: "Clear date",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const roundDateToNearestHour = {
	customId: "roundToNearestHour",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "roundToNearestHour",
		label: "Round to nearest hour",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const endGiveaway = {
	customId: "endGiveaway",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endGiveaway",
		label: "End giveaway",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const endLevelNone = {
	customId: "endLevelNone",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelNone",
		label: "None",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const endLevelEnd = {
	customId: "endLevelEnd",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelEnd",
		label: "End",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const endLevelRoll = {
	customId: "endLevelRoll",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelRoll",
		label: "Roll",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const endLevelAnnounce = {
	customId: "endLevelAnnounce",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelAnnounce",
		label: "Announce",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const cancel = {
	customId: "cancel",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "cancel",
		label: "Cancel",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button
	})
} as const;

export const adjustDate = ({
	label,
	customId,
	disabled = false
}: {
	label: string;
	customId: string;
	disabled?: boolean;
}) =>
	({
		customId,
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: customId,
			label,
			style: ButtonStyle.Secondary,
			disabled,
			type: ComponentType.Button
		})
	} as const);

export const url = ({ label, url }: { label: string; url: string }) => ({
	component: (): APIButtonComponentWithURL => ({
		label,
		style: ButtonStyle.Link,
		url,
		type: ComponentType.Button
	})
});

export const caseLogOptions = {
	customId: "caseLogOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "caseLogOptions",
		label: "Case log options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const memberLogOptions = {
	customId: "memberLogOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "memberLogOptions",
		label: "Member log options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const messageLogOptions = {
	customId: "messageLogOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "messageLogOptions",
		label: "Message log options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const pinArchiveOptions = {
	customId: "pinArchiveOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "pinArchiveOptions",
		label: "Pin archive options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const protectedChannelsOptions = {
	customId: "protectedChannelsOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "protectedChannelsOptions",
		label: "Protected channels options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const reportChannelOptions = {
	customId: "reportChannelOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "reportChannelOptions",
		label: "Report channel options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const restrictRolesOptions = {
	customId: "restrictRolesOptions",
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "restrictRolesOptions",
		label: "Restrict roles options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button
	})
} as const;

export const reset = {
	customId: "reset",
	component: (suffix?: string): APIButtonComponentWithCustomId => ({
		custom_id: "reset",
		label: suffix ? `Reset ${suffix}` : "Reset",
		style: ButtonStyle.Danger,
		type: ComponentType.Button
	})
} as const;

export const acceptPrize = (id: number) => ({
	customId: `accept-prize-${id}`,
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: `accept-prize-${id}`,
		label: "Accept prize",
		emoji: formatEmoji(Emojis.StarEyes),
		style: ButtonStyle.Success,
		type: ComponentType.Button
	})
});

export const attachToLatestCase = (reportId: number) =>
	({
		customId: `attach-report-${reportId}-to-latest-case`,
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `attach-report-${reportId}-to-latest-case`,
			label: "Attach to latest case",
			style: ButtonStyle.Primary,
			type: ComponentType.Button
		})
	} as const);

export const unattachReportFromCases = (reportId: number) =>
	({
		customId: `unattach-report-${reportId}-from-cases`,
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: "Case",
			label: `unattach-report-${reportId}-from-cases`,
			style: ButtonStyle.Primary,
			type: ComponentType.Button
		})
	} as const);

export const markReportProcessed = (reportId: number) =>
	({
		customId: `mark-report-processed-${reportId}`,
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `mark-report-${reportId}-processed`,
			label: "Mark processed",
			style: ButtonStyle.Secondary,
			type: ComponentType.Button
		})
	} as const);

export const markReportUnprocessed = (reportId: number) =>
	({
		customId: `mark-report-${reportId}-unprocessed`,
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `mark-report-${reportId}-unprocessed`,
			label: "Mark unprocessed",
			style: ButtonStyle.Danger,
			type: ComponentType.Button
		})
	} as const);

export const memberInfo = (userId: string, prefix = "Member") =>
	({
		customId: `member-info-${userId}-${prefix}`,
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `member-info-${userId}-${prefix}`,
			label: `${prefix} info`,
			style: ButtonStyle.Secondary,
			type: ComponentType.Button
		})
	} as const);
