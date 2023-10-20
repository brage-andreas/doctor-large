import {
	type APIButtonComponentWithCustomId,
	type APIButtonComponentWithURL,
	type APIMessageComponentEmoji,
	ButtonStyle,
	ComponentType,
} from "discord.js";
import { type CustomIdCompatibleButtonStyle } from "#typings";
import { Emojis, Regex } from "#constants";

const formatEmoji = (emoji: string): APIMessageComponentEmoji => {
	if (!emoji.startsWith("<")) {
		return {
			name: emoji,
		};
	}

	const match = emoji.match(Regex.Emoji);

	if (!match?.groups) {
		throw new TypeError(`Supplied emoji is not unicode nor Discord emoji: ${emoji}`);
	}

	const { animated, id, name } = match.groups;

	return {
		animated: Boolean(animated),
		id,
		name,
	};
};

export const announceGiveaway = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "announceGiveaway",
		label: "Announce",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "announceGiveaway",
} as const;

export const announcementOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "announcementOptions",
		label: "Announcement options",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "announcementOptions",
} as const;

export const lockEntries = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "lockEntries",
		emoji: formatEmoji(Emojis.Lock),
		label: "Lock entries",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "lockEntries",
} as const;

export const unlockEntries = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "unlockEntries",
		emoji: formatEmoji(Emojis.Unlock),
		label: "Unlock entries",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "unlockEntries",
} as const;

export const setRequiredRoles = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setRequiredRoles",
		label: "Set required roles",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "setRequiredRoles",
} as const;

export const setPingRolesToAtEveryone = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setPingRolesToAtEveryone",
		label: "Set to @everyone",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "setPingRolesToAtEveryone",
} as const;

export const setPingRoles = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setPingRoles",
		label: "Set ping roles",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "setPingRoles",
} as const;

export const edit = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "edit",
		emoji: formatEmoji(Emojis.Edit),
		label: "Edit",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "edit",
} as const;

export const managePrizes = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "managePrizes",
		label: "Manage prizes",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "managePrizes",
} as const;

export const endOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endOptions",
		label: "End options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "endOptions",
} as const;

export const deleteGiveaway = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "deleteGiveaway",
		label: "Delete giveaway",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "deleteGiveaway",
} as const;

export const lastChannel = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "lastChannel",
		label: "Use the previous channel",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "lastChannel",
} as const;

export const editCurrentMessage = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "editCurrent",
		label: "Edit current message",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "editCurrent",
} as const;

export const recallCurrentMessage = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "recallCurrent",
		label: "Recall current message",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "recallCurrent",
} as const;

export const enterGiveaway = {
	component: (id: number): APIButtonComponentWithCustomId => ({
		custom_id: `enter-giveaway-${id}`,
		emoji: formatEmoji(Emojis.EnterGiveaway),
		label: "Enter",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: (id: number) => `enter-giveaway-${id}`,
} as const;

export const reactivateGiveaway = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "reactivateGiveaway",
		label: "Reactivate giveaway",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "reactivateGiveaway",
} as const;

export const announceWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "announceWinners",
		label: "Announce winners",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "announceWinners",
} as const;

export const reannounceWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "reannounceWinners",
		label: "Reannounce winners",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "reannounceWinners",
} as const;

export const unannounceWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "unannounceWinners",
		label: "Unannounce winners",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "unannounceWinners",
} as const;

export const showAllWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "showAllWinners",
		label: "Show all winners",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "showAllWinners",
} as const;

export const rollWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "rollWinners",
		label: "Roll winners",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "rollWinners",
} as const;

export const rerollWinners = {
	component: (n: number): APIButtonComponentWithCustomId => ({
		custom_id: "rerollWinners",
		label: `Reroll unclaimed (${n})`,
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "rerollWinners",
} as const;

export const rerollAllWinners = {
	component: (n: number): APIButtonComponentWithCustomId => ({
		custom_id: "rerollAllWinners",
		label: `Reroll all (${n})`,
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "rerollAllWinners",
} as const;

export const deleteUnclaimedWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "deleteUnclaimedWinners",
		label: "Delete unclaimed",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "deleteUnclaimedWinners",
} as const;

export const deleteAllWinners = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "deleteAllWinners",
		label: "Delete all",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "deleteAllWinners",
} as const;

export const enable = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "enable",
		label: "Enable",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "enable",
} as const;

export const disable = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "disable",
		label: "Disable",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "disable",
} as const;

export const clear = {
	component: (suffix?: string): APIButtonComponentWithCustomId => ({
		custom_id: "clear",
		label: suffix ? `Clear ${suffix}` : "Clear",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "clear",
} as const;

export const create = {
	component: (suffix?: string): APIButtonComponentWithCustomId => ({
		custom_id: "create",
		label: suffix ? `Create ${suffix}` : "Create",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "create",
} as const;

export const back = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "back",
		label: "Back",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "back",
} as const;

export const acceptAllPrizes = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "acceptAllPrizes",
		emoji: formatEmoji(Emojis.Tada),
		label: "Accept all prizes",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "acceptAllPrizes",
} as const;

export const viewAllEntered = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "viewAllEntered",
		label: "View entered",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "viewAllEntered",
} as const;

export const viewAllPrizes = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "viewAllPrizes",
		label: "View prizes",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "viewAllPrizes",
} as const;

export const viewAllHosted = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "viewAllHosted",
		label: "View hosted",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "viewAllHosted",
} as const;

export const yes = {
	component: (style: CustomIdCompatibleButtonStyle): APIButtonComponentWithCustomId => ({
		custom_id: "yes",
		emoji: formatEmoji(Emojis.Check),
		label: "Yes",
		style,
		type: ComponentType.Button,
	}),
	customId: "yes",
} as const;

export const no = {
	component: (style: CustomIdCompatibleButtonStyle): APIButtonComponentWithCustomId => ({
		custom_id: "no",
		emoji: formatEmoji(Emojis.Cross),
		label: "No",
		style,
		type: ComponentType.Button,
	}),
	customId: "no",
} as const;

export const resetLevel4 = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel4",
		label: "Level 4",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "resetLevel4",
} as const;

export const resetLevel3 = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel3",
		label: "Level 3",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "resetLevel3",
} as const;

export const resetLevel2 = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel2",
		label: "Level 2",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "resetLevel2",
} as const;

export const resetLevel1 = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "resetLevel1",
		label: "Level 1",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: "resetLevel1",
} as const;

export const delete_ = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "delete",
		label: "Delete",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "delete",
} as const;

export const endedGiveaway = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "giveaway-ended",
		disabled: true,
		label: "Giveaway has ended!",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "giveaway-ended",
} as const;

export const setDate = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "setDate",
		label: "Set date",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "setDate",
} as const;

export const clearDate = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "clearDate",
		label: "Clear date",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "clearDate",
} as const;

export const roundDateToNearestHour = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "roundToNearestHour",
		label: "Round to nearest hour",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "roundToNearestHour",
} as const;

export const endGiveaway = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endGiveaway",
		label: "End giveaway",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "endGiveaway",
} as const;

export const endLevelNone = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelNone",
		label: "None",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "endLevelNone",
} as const;

export const endLevelEnd = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelEnd",
		label: "End",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "endLevelEnd",
} as const;

export const endLevelRoll = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelRoll",
		label: "Roll",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "endLevelRoll",
} as const;

export const endLevelAnnounce = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "endLevelAnnounce",
		label: "Announce",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "endLevelAnnounce",
} as const;

export const cancel = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "cancel",
		label: "Cancel",
		style: ButtonStyle.Secondary,
		type: ComponentType.Button,
	}),
	customId: "cancel",
} as const;

export const adjustDate = ({
	customId,
	disabled = false,
	label,
}: {
	customId: string;
	disabled?: boolean;
	label: string;
}) =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: customId,
			disabled,
			label,
			style: ButtonStyle.Secondary,
			type: ComponentType.Button,
		}),
		customId,
	}) as const;

export const url = ({ label, url }: { label: string; url: string }) => ({
	component: (): APIButtonComponentWithURL => ({
		label,
		style: ButtonStyle.Link,
		type: ComponentType.Button,
		url,
	}),
});

export const caseLogOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "caseLogOptions",
		label: "Case log options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "caseLogOptions",
} as const;

export const memberLogOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "memberLogOptions",
		label: "Member log options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "memberLogOptions",
} as const;

export const messageLogOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "messageLogOptions",
		label: "Message log options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "messageLogOptions",
} as const;

export const pinArchiveOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "pinArchiveOptions",
		label: "Pin archive options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "pinArchiveOptions",
} as const;

export const protectedChannelsOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "protectedChannelsOptions",
		label: "Protected channels options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "protectedChannelsOptions",
} as const;

export const reportChannelOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "reportChannelOptions",
		label: "Report channel options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "reportChannelOptions",
} as const;

export const restrictRolesOptions = {
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: "restrictRolesOptions",
		label: "Restrict roles options",
		style: ButtonStyle.Primary,
		type: ComponentType.Button,
	}),
	customId: "restrictRolesOptions",
} as const;

export const reset = {
	component: (suffix?: string): APIButtonComponentWithCustomId => ({
		custom_id: "reset",
		label: suffix ? `Reset ${suffix}` : "Reset",
		style: ButtonStyle.Danger,
		type: ComponentType.Button,
	}),
	customId: "reset",
} as const;

export const acceptPrize = (id: number) => ({
	component: (): APIButtonComponentWithCustomId => ({
		custom_id: `accept-prize-${id}`,
		emoji: formatEmoji(Emojis.StarEyes),
		label: "Accept prize",
		style: ButtonStyle.Success,
		type: ComponentType.Button,
	}),
	customId: `accept-prize-${id}`,
});

export const attachToLatestCase = (reportId: number) =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `attach-report-${reportId}-to-latest-case`,
			label: "Attach to latest case",
			style: ButtonStyle.Primary,
			type: ComponentType.Button,
		}),
		customId: `attach-report-${reportId}-to-latest-case`,
	}) as const;

export const unattachReportFromCases = (reportId: number) =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: "Case",
			label: `unattach-report-${reportId}-from-cases`,
			style: ButtonStyle.Primary,
			type: ComponentType.Button,
		}),
		customId: `unattach-report-${reportId}-from-cases`,
	}) as const;

export const markReportProcessed = (reportId: number) =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `mark-report-${reportId}-processed`,
			label: "Mark processed",
			style: ButtonStyle.Secondary,
			type: ComponentType.Button,
		}),
		customId: `mark-report-${reportId}-processed`,
	}) as const;

export const markReportUnprocessed = (reportId: number) =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `mark-report-${reportId}-unprocessed`,
			label: "Mark unprocessed",
			style: ButtonStyle.Danger,
			type: ComponentType.Button,
		}),
		customId: `mark-report-${reportId}-unprocessed`,
	}) as const;

export const memberInfo = (userId: string, prefix = "Member") =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `member-info-${userId}-${prefix}`,
			label: `${prefix} info`,
			style: ButtonStyle.Secondary,
			type: ComponentType.Button,
		}),
		customId: `member-info-${userId}-${prefix}`,
	}) as const;

export const previewMessage = (channelId: string, messageId: string) =>
	({
		component: (): APIButtonComponentWithCustomId => ({
			custom_id: `preview-message-${channelId}-${messageId}`,
			label: "Preview message",
			style: ButtonStyle.Secondary,
			type: ComponentType.Button,
		}),
		customId: `preview-message-${channelId}-${messageId}`,
	}) as const;
