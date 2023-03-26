import { Emojis } from "#constants";
import { ButtonBuilder, ButtonStyle } from "discord.js";

export const announceGiveaway = {
	customId: "announcementGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "announcementGiveaway",
			style: ButtonStyle.Success,
			label: "Announce"
		})
} as const;

export const announcementOptions = {
	customId: "announcementOptions",
	component: () =>
		new ButtonBuilder({
			customId: "announcementOptions",
			style: ButtonStyle.Success,
			label: "Announcement options"
		})
} as const;

export const lockEntries = {
	customId: "lockEntries",
	component: () =>
		new ButtonBuilder({
			customId: "lockEntries",
			style: ButtonStyle.Secondary,
			emoji: Emojis.Lock,
			label: "Lock entries"
		})
} as const;

export const unlockEntries = {
	customId: "unlockEntries",
	component: () =>
		new ButtonBuilder({
			customId: "unlockEntries",
			emoji: Emojis.Unlock,
			label: "Unlock entries",
			style: ButtonStyle.Secondary
		})
} as const;

export const setRequiredRoles = {
	customId: "setRequiredRoles",
	component: () =>
		new ButtonBuilder({
			customId: "setRequiredRoles",
			style: ButtonStyle.Secondary,
			label: "Set required roles"
		})
} as const;

export const setPingRolesToAtEveryone = {
	customId: "setPingRolesToAtEveryone",
	component: () =>
		new ButtonBuilder({
			customId: "setPingRolesToAtEveryone",
			style: ButtonStyle.Primary,
			label: "Set to @everyone"
		})
} as const;

export const setPingRoles = {
	customId: "setPingRoles",
	component: () =>
		new ButtonBuilder({
			customId: "setPingRoles",
			style: ButtonStyle.Secondary,
			label: "Set ping roles"
		})
} as const;

export const edit = {
	customId: "edit",
	component: () =>
		new ButtonBuilder({
			customId: "edit",
			style: ButtonStyle.Primary,
			emoji: Emojis.Edit,
			label: "Edit"
		})
} as const;

export const managePrizes = {
	customId: "managePrizes",
	component: () =>
		new ButtonBuilder({
			customId: "managePrizes",
			style: ButtonStyle.Success,
			label: "Manage prizes"
		})
} as const;

export const endOptions = {
	customId: "endOptions",
	component: () =>
		new ButtonBuilder({
			customId: "endOptions",
			style: ButtonStyle.Primary,
			label: "End options"
		})
} as const;

export const deleteGiveaway = {
	customId: "deleteGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "deleteGiveaway",
			style: ButtonStyle.Danger,
			label: "Delete giveaway"
		})
} as const;

export const lastChannel = {
	customId: "lastChannel",
	component: () =>
		new ButtonBuilder({
			customId: "lastChannel",
			label: "Use the previous channel",
			style: ButtonStyle.Primary
		})
} as const;

export const editCurrentMessage = {
	customId: "editCurrent",
	component: () =>
		new ButtonBuilder({
			customId: "editCurrent",
			label: "Edit current message",
			style: ButtonStyle.Success
		})
} as const;

export const recallCurrentMessage = {
	customId: "recallCurrent",
	component: () =>
		new ButtonBuilder({
			customId: "recallCurrent",
			label: "Recall current message",
			style: ButtonStyle.Danger
		})
} as const;

export const enterGiveaway = {
	customId: (id: number) => `enter-giveaway-${id}`,
	component: (id: number) =>
		new ButtonBuilder({
			customId: `enter-giveaway-${id}`,
			label: "Enter",
			style: ButtonStyle.Success,
			emoji: Emojis.EnterGiveaway
		})
} as const;

export const reactivateGiveaway = {
	customId: "reactivateGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "reactivateGiveaway",
			label: "Reactivate giveaway",
			style: ButtonStyle.Secondary
		})
} as const;

export const announceWinners = {
	customId: "announceWinners",
	component: () =>
		new ButtonBuilder({
			customId: "announceWinners",
			label: "Announce winners",
			style: ButtonStyle.Success
		})
} as const;

export const reannounceWinners = {
	customId: "reannounceWinners",
	component: () =>
		new ButtonBuilder({
			customId: "reannounceWinners",
			label: "Reannounce winners",
			style: ButtonStyle.Success
		})
} as const;

export const unannounceWinners = {
	customId: "unannounceWinners",
	component: () =>
		new ButtonBuilder({
			customId: "unannounceWinners",
			label: "Unannounce winners",
			style: ButtonStyle.Secondary
		})
} as const;

export const showAllWinners = {
	customId: "showAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "showAllWinners",
			label: "Show all winners",
			style: ButtonStyle.Primary
		})
} as const;

export const rollWinners = {
	customId: "rollWinners",
	component: () =>
		new ButtonBuilder({
			customId: "rollWinners",
			label: "Roll winners",
			style: ButtonStyle.Success
		})
} as const;

export const rerollWinners = {
	customId: "rerollWinners",
	component: (n: number) =>
		new ButtonBuilder({
			customId: "rerollWinners",
			label: `Reroll unclaimed (${n})`,
			style: ButtonStyle.Secondary
		})
} as const;

export const rerollAllWinners = {
	customId: "rerollAllWinners",
	component: (n: number) =>
		new ButtonBuilder({
			customId: "rerollAllWinners",
			label: `Reroll all (${n})`,
			style: ButtonStyle.Danger
		})
} as const;

export const deleteUnclaimedWinners = {
	customId: "deleteUnclaimedWinners",
	component: () =>
		new ButtonBuilder({
			customId: "deleteUnclaimedWinners",
			label: "Delete unclaimed",
			style: ButtonStyle.Secondary
		})
} as const;

export const deleteAllWinners = {
	customId: "deleteAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "deleteAllWinners",
			label: "Delete all",
			style: ButtonStyle.Danger
		})
} as const;

export const enable = {
	customId: "enable",
	component: () =>
		new ButtonBuilder({
			customId: "enable",
			label: "Enable",
			style: ButtonStyle.Success
		})
} as const;

export const disable = {
	customId: "disable",
	component: () =>
		new ButtonBuilder({
			label: "Disable",
			customId: "disable",
			style: ButtonStyle.Danger
		})
} as const;

export const clear = {
	customId: "clear",
	component: (suffix?: string) =>
		new ButtonBuilder({
			customId: "clear",
			label: suffix ? `Clear ${suffix}` : "Clear",
			style: ButtonStyle.Danger
		})
} as const;

export const create = {
	customId: "create",
	component: () =>
		new ButtonBuilder({
			customId: "create",
			label: "Create",
			style: ButtonStyle.Success
		})
} as const;

export const back = {
	customId: "back",
	component: () =>
		new ButtonBuilder({
			customId: "back",
			label: "Back",
			style: ButtonStyle.Secondary
		})
} as const;

export const acceptAllPrizes = {
	customId: "acceptAllPrizes",
	component: () =>
		new ButtonBuilder({
			customId: "acceptAllPrizes",
			emoji: Emojis.Tada,
			label: "Accept all prizes",
			style: ButtonStyle.Success
		})
} as const;

export const viewAllEntered = {
	customId: "viewAllEntered",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllEntered",
			label: "View entered",
			style: ButtonStyle.Secondary
		})
} as const;

export const viewAllPrizes = {
	customId: "viewAllPrizes",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllPrizes",
			label: "View prizes",
			style: ButtonStyle.Secondary
		})
} as const;

export const viewAllHosted = {
	customId: "viewAllHosted",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllHosted",
			label: "View hosted",
			style: ButtonStyle.Secondary
		})
} as const;

export const yes = {
	customId: "yes",
	component: (style: ButtonStyle) =>
		new ButtonBuilder()
			.setCustomId("yes")
			.setEmoji(Emojis.V)
			.setStyle(style)
			.setLabel("Yes")
} as const;

export const no = {
	customId: "no",
	component: (style: ButtonStyle) =>
		new ButtonBuilder()
			.setCustomId("no")
			.setEmoji(Emojis.X)
			.setStyle(style)
			.setLabel("No")
} as const;

export const resetLevel4 = {
	customId: "resetLevel4",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel4")
			.setLabel("Level 4")
			.setStyle(ButtonStyle.Danger)
} as const;

export const resetLevel3 = {
	customId: "resetLevel3",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel3")
			.setLabel("Level 3")
			.setStyle(ButtonStyle.Secondary)
} as const;

export const resetLevel2 = {
	customId: "resetLevel2",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel2")
			.setLabel("Level 2")
			.setStyle(ButtonStyle.Secondary)
} as const;

export const resetLevel1 = {
	customId: "resetLevel1",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel1")
			.setLabel("Level 1")
			.setStyle(ButtonStyle.Success)
} as const;

export const delete_ = {
	customId: "delete",
	component: () =>
		new ButtonBuilder()
			.setCustomId("delete")
			.setStyle(ButtonStyle.Danger)
			.setLabel("Delete")
} as const;

export const endedGiveaway = {
	customId: "giveaway-ended",
	component: () =>
		new ButtonBuilder()
			.setCustomId("giveaway-ended")
			.setDisabled(true)
			.setLabel("This giveaway has ended!")
			.setStyle(ButtonStyle.Secondary)
} as const;

export const setDate = {
	customId: "setDate",
	component: () =>
		new ButtonBuilder()
			.setCustomId("setDate")
			.setLabel("Set date")
			.setStyle(ButtonStyle.Primary)
} as const;

export const clearDate = {
	customId: "clearDate",
	component: () =>
		new ButtonBuilder()
			.setCustomId("clearDate")
			.setLabel("Clear date")
			.setStyle(ButtonStyle.Primary)
} as const;

export const roundDateToNearestHour = {
	customId: "roundToNearestHour",
	component: () =>
		new ButtonBuilder()
			.setCustomId("roundToNearestHour")
			.setLabel("Round to nearest hour")
			.setStyle(ButtonStyle.Primary)
} as const;

export const endGiveaway = {
	customId: "endGiveaway",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endGiveaway")
			.setLabel("End giveaway")
			.setStyle(ButtonStyle.Danger)
} as const;

export const endLevelNone = {
	customId: "endLevelNone",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelNone")
			.setLabel("None")
			.setStyle(ButtonStyle.Primary)
} as const;

export const endLevelEnd = {
	customId: "endLevelEnd",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelEnd")
			.setLabel("End")
			.setStyle(ButtonStyle.Primary)
} as const;

export const endLevelRoll = {
	customId: "endLevelRoll",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelRoll")
			.setLabel("Roll")
			.setStyle(ButtonStyle.Primary)
} as const;

export const endLevelAnnounce = {
	customId: "endLevelAnnounce",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelAnnounce")
			.setLabel("Announce")
			.setStyle(ButtonStyle.Primary)
} as const;

export const cancel = {
	customId: "cancel",
	component: () =>
		new ButtonBuilder()
			.setCustomId("cancel")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Secondary)
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
		component: () =>
			new ButtonBuilder()
				.setCustomId(customId)
				.setLabel(label)
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(disabled)
	} as const);

export const url = ({ label, url }: { label: string; url: string }) => ({
	component: () =>
		new ButtonBuilder()
			.setLabel(label)
			.setStyle(ButtonStyle.Link)
			.setURL(url)
});

export const caseLogOptions = {
	customId: "caseLogOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("caseLogOptions")
			.setLabel("Case log options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const memberLogOptions = {
	customId: "memberLogOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("memberLogOptions")
			.setLabel("Member log options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const messageLogOptions = {
	customId: "messageLogOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("messageLogOptions")
			.setLabel("Message log options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const pinArchiveOptions = {
	customId: "pinArchiveOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("pinArchiveOptions")
			.setLabel("Pin archive options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const protectedChannelsOptions = {
	customId: "protectedChannelsOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("protectedChannelsOptions")
			.setLabel("Protected channels options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const reportChannelOptions = {
	customId: "reportChannelOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("reportChannelOptions")
			.setLabel("Report channel options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const restrictRolesOptions = {
	customId: "restrictRolesOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("restrictRolesOptions")
			.setLabel("Restrict roles options")
			.setStyle(ButtonStyle.Primary)
} as const;

export const reset = {
	customId: "reset",
	component: (suffix?: string) =>
		new ButtonBuilder()
			.setCustomId("reset")
			.setLabel(suffix ? `Reset ${suffix}` : "Reset")
			.setStyle(ButtonStyle.Danger)
} as const;

export const acceptPrize = (id: number) => ({
	customId: `accept-prize-${id}`,
	component: () =>
		new ButtonBuilder()
			.setCustomId(`accept-prize-${id}`)
			.setLabel("Accept prize")
			.setEmoji(Emojis.StarEyes)
			.setStyle(ButtonStyle.Success)
});

export const attachToLatestCase = {
	customId: "attachToLatestCase",
	component: () =>
		new ButtonBuilder()
			.setCustomId("attachToLatestCase")
			.setLabel("Attach to latest case")
			.setStyle(ButtonStyle.Success)
} as const;

export const markComplete = {
	customId: "markComplete",
	component: () =>
		new ButtonBuilder()
			.setCustomId("markComplete")
			.setLabel("Mark complete")
			.setStyle(ButtonStyle.Secondary)
} as const;
