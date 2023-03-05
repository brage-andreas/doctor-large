import { Emojis, Giveaway } from "#constants";
import { modalId } from "#helpers/ModalCollector.js";
import { oneLine } from "common-tags";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelSelectMenuBuilder,
	ChannelType,
	ComponentType,
	ModalBuilder,
	RoleSelectMenuBuilder,
	TextInputBuilder,
	TextInputStyle,
	type MentionableSelectMenuBuilder,
	type StringSelectMenuBuilder,
	type UserSelectMenuBuilder
} from "discord.js";

interface ComponentObject {
	readonly customId: string;
	component(): CompatibleComponentBuilder;
}

type CompatibleComponentBuilder =
	| ButtonBuilder
	| ChannelSelectMenuBuilder
	| MentionableSelectMenuBuilder
	| RoleSelectMenuBuilder
	| StringSelectMenuBuilder
	| UserSelectMenuBuilder;

type CompatibleActionRow =
	| ActionRowBuilder<ButtonBuilder>
	| ActionRowBuilder<ChannelSelectMenuBuilder>
	| ActionRowBuilder<MentionableSelectMenuBuilder>
	| ActionRowBuilder<RoleSelectMenuBuilder>
	| ActionRowBuilder<StringSelectMenuBuilder>
	| ActionRowBuilder<UserSelectMenuBuilder>;

const createRows = (
	...components: Array<CompatibleComponentBuilder | ComponentObject>
): Array<CompatibleActionRow> => {
	const rows: Array<CompatibleActionRow> = [];

	components.forEach((compOrObj) => {
		const comp =
			"component" in compOrObj ? compOrObj.component() : compOrObj;

		switch (comp.data.type) {
			case ComponentType.Button: {
				let last = rows.at(-1) ?? new ActionRowBuilder<ButtonBuilder>();

				if (
					last.components.some(
						(c) => c.data.type !== ComponentType.Button
					)
				) {
					last = new ActionRowBuilder<ButtonBuilder>();
				} else if (last.components.length) {
					rows.pop();
				}

				last = last as ActionRowBuilder<ButtonBuilder>;

				if (last.components.length === 5) {
					const newRow =
						new ActionRowBuilder<ButtonBuilder>().setComponents(
							comp as ButtonBuilder
						);

					rows.push(newRow);
				} else {
					last.addComponents(comp as ButtonBuilder);

					rows.push(last);
				}

				break;
			}

			case ComponentType.ChannelSelect: {
				rows.push(
					new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
						comp as ChannelSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.MentionableSelect: {
				rows.push(
					new ActionRowBuilder<MentionableSelectMenuBuilder>().setComponents(
						comp as MentionableSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.RoleSelect: {
				rows.push(
					new ActionRowBuilder<RoleSelectMenuBuilder>().setComponents(
						comp as RoleSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.StringSelect: {
				rows.push(
					new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
						comp as StringSelectMenuBuilder
					)
				);

				break;
			}

			case ComponentType.UserSelect: {
				rows.push(
					new ActionRowBuilder<UserSelectMenuBuilder>().setComponents(
						comp as UserSelectMenuBuilder
					)
				);

				break;
			}
		}
	});

	return rows.slice(0, 5);
};

const modalGiveawayTitle = () =>
	new TextInputBuilder({
		customId: "title",
		label: "Title",
		maxLength: Giveaway.MaxTitleLength,
		placeholder: "Summer Giveaway 2044",
		required: true,
		style: TextInputStyle.Short
	});

const modalGiveawayDescription = () =>
	new TextInputBuilder({
		customId: "description",
		label: `Description (max ${Giveaway.MaxDescriptionLines} lines)`,
		maxLength: Giveaway.MaxDescriptionLength,
		style: TextInputStyle.Paragraph,
		placeholder: oneLine`
			It's this time of year again!
			This is a thanks for a good year 💝
		`
	});

const modalGiveawaywinnerQuantity = () =>
	new TextInputBuilder({
		customId: "winnerQuantity",
		label: "Number of winners",
		maxLength: Giveaway.ManWinnerQuantityLength,
		style: TextInputStyle.Short,
		placeholder: "1"
	});

/**
 * Children: title, description, winnerQuantity
 */
const createOptionsModal = {
	component: () =>
		new ModalBuilder({
			customId: modalId(),
			title: "Create a giveaway",
			components: [
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayTitle()]
				},
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayDescription()]
				},
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawaywinnerQuantity()]
				}
			]
		})
} as const;

const modalGiveawayNewTitle = (oldTitle: string) =>
	new TextInputBuilder({
		customId: "newTitle",
		label: "New Title",
		maxLength: Giveaway.MaxTitleLength,
		style: TextInputStyle.Short,
		required: true,
		value: oldTitle,
		placeholder: oldTitle
	});

const EMPTY_DESCRIPTION = `${Emojis.Sleep} Whoa so empty — there is no description`;
const parsePlaceholder = (string: string | null) => {
	if (!string) {
		return EMPTY_DESCRIPTION;
	}

	if (100 < string.length) {
		return `${string.slice(0, 97)}...`;
	}

	return string;
};

const modalGiveawayNewDescription = (oldDescription: string | null) => {
	const builder = new TextInputBuilder({
		customId: "newDescription",
		label: `New description (max ${Giveaway.MaxDescriptionLines} lines)`,
		maxLength: Giveaway.MaxDescriptionLength,
		style: TextInputStyle.Paragraph,
		required: true
	});

	if (oldDescription) {
		builder.setValue(oldDescription);
		builder.setPlaceholder(parsePlaceholder(oldDescription));
	}

	return builder;
};

const modalGiveawayNewWinnerQuantity = (oldNumberOfWinners: number) =>
	new TextInputBuilder({
		customId: "newWinnerQuantity",
		label: "New number of winners",
		maxLength: Giveaway.ManWinnerQuantityLength,
		style: TextInputStyle.Short,
		required: true,
		value: oldNumberOfWinners.toString(),
		placeholder: oldNumberOfWinners.toString()
	});

/**
 * Children: newTitle, newDescription, newWinnerQuantity
 */
const editOptionsModal = {
	component: ({
		guildRelativeId,
		oldTitle,
		oldDescription,
		oldWinnerQuantity
	}: {
		guildRelativeId: number;
		oldTitle: string;
		oldDescription: string | null;
		oldWinnerQuantity: number;
	}) =>
		new ModalBuilder({
			customId: modalId(),
			title: `Edit giveaway #${guildRelativeId}`,
			components: [
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayNewTitle(oldTitle)]
				},
				{
					type: ComponentType.ActionRow,
					components: [modalGiveawayNewDescription(oldDescription)]
				},
				{
					type: ComponentType.ActionRow,
					components: [
						modalGiveawayNewWinnerQuantity(oldWinnerQuantity)
					]
				}
			]
		})
} as const;

const publishGiveawayButton = {
	customId: "publishGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "publishGiveaway",
			style: ButtonStyle.Success,
			label: "Publish"
		})
} as const;

const publishingOptionsButton = {
	customId: "publishingOptions",
	component: () =>
		new ButtonBuilder({
			customId: "publishingOptions",
			style: ButtonStyle.Success,
			label: "Publishing Options"
		})
} as const;

const lockEntriesButton = {
	customId: "lockEntries",
	component: () =>
		new ButtonBuilder({
			customId: "lockEntries",
			style: ButtonStyle.Secondary,
			emoji: Emojis.Lock,
			label: "Lock entries"
		})
} as const;

const unlockEntriesButton = {
	customId: "unlockEntries",
	component: () =>
		new ButtonBuilder({
			customId: "unlockEntries",
			emoji: Emojis.Unlock,
			label: "Unlock entries",
			style: ButtonStyle.Secondary
		})
} as const;

const setRequiredRolesButton = {
	customId: "setRequiredRoles",
	component: () =>
		new ButtonBuilder({
			customId: "setRequiredRoles",
			style: ButtonStyle.Secondary,
			label: "Set required roles"
		})
} as const;

const setPingRolesToAtEveryoneButton = {
	customId: "setPingRolesToAtEveryone",
	component: () =>
		new ButtonBuilder({
			customId: "setPingRolesToAtEveryone",
			style: ButtonStyle.Primary,
			label: "Set to @everyone"
		})
} as const;

const setPingRolesButton = {
	customId: "setPingRoles",
	component: () =>
		new ButtonBuilder({
			customId: "setPingRoles",
			style: ButtonStyle.Secondary,
			label: "Set ping roles"
		})
} as const;

const editButton = {
	customId: "edit",
	component: () =>
		new ButtonBuilder({
			customId: "edit",
			style: ButtonStyle.Primary,
			emoji: Emojis.Edit,
			label: "Edit"
		})
} as const;

const managePrizesButton = {
	customId: "managePrizes",
	component: () =>
		new ButtonBuilder({
			customId: "managePrizes",
			style: ButtonStyle.Success,
			label: "Manage prizes"
		})
} as const;

const endOptionsButton = {
	customId: "endOptions",
	component: () =>
		new ButtonBuilder({
			customId: "endOptions",
			style: ButtonStyle.Primary,
			label: "End options"
		})
} as const;

const deleteGiveawayButton = {
	customId: "deleteGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "deleteGiveaway",
			style: ButtonStyle.Danger,
			label: "Delete giveaway"
		})
} as const;

const lastChannelButton = {
	customId: "lastChannel",
	component: () =>
		new ButtonBuilder({
			customId: "lastChannel",
			label: "Use the previous channel",
			style: ButtonStyle.Primary
		})
} as const;

const editCurrentMessageButton = {
	customId: "editCurrent",
	component: () =>
		new ButtonBuilder({
			customId: "editCurrent",
			label: "Edit current message",
			style: ButtonStyle.Success
		})
} as const;

const recallCurrentMessageButton = {
	customId: "recallCurrent",
	component: () =>
		new ButtonBuilder({
			customId: "recallCurrent",
			label: "Recall current message",
			style: ButtonStyle.Danger
		})
} as const;

const enterGiveawayButton = {
	customId: (id: number) => `enter-giveaway-${id}`,
	component: (id: number) =>
		new ButtonBuilder({
			customId: `enter-giveaway-${id}`,
			label: "Enter",
			style: ButtonStyle.Success,
			emoji: Emojis.EnterGiveaway
		})
} as const;

const reactivateGiveawayButton = {
	customId: "reactivateGiveaway",
	component: () =>
		new ButtonBuilder({
			customId: "reactivateGiveaway",
			label: "Reactivate giveaway",
			style: ButtonStyle.Secondary
		})
} as const;

const publishWinnersButton = {
	customId: "publishWinners",
	component: () =>
		new ButtonBuilder({
			customId: "publishWinners",
			label: "Publish winners",
			style: ButtonStyle.Success
		})
} as const;

const republishWinnersButton = {
	customId: "republishWinners",
	component: () =>
		new ButtonBuilder({
			customId: "republishWinners",
			label: "Republish winners",
			style: ButtonStyle.Success
		})
} as const;

const unpublishWinnersButton = {
	customId: "unpublishWinners",
	component: () =>
		new ButtonBuilder({
			customId: "unpublishWinners",
			label: "Unpublish winners",
			style: ButtonStyle.Secondary
		})
} as const;

const showAllWinnersButton = {
	customId: "showAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "showAllWinners",
			label: "Show all winners",
			style: ButtonStyle.Primary
		})
} as const;

const rollWinnersButton = {
	customId: "rollWinners",
	component: () =>
		new ButtonBuilder({
			customId: "rollWinners",
			label: "Roll winners",
			style: ButtonStyle.Success
		})
} as const;

const rerollWinnersButton = {
	customId: "rerollWinners",
	component: (n: number) =>
		new ButtonBuilder({
			customId: "rerollWinners",
			label: `Reroll unclaimed (${n})`,
			style: ButtonStyle.Secondary
		})
} as const;

const rerollAllWinnersButton = {
	customId: "rerollAllWinners",
	component: (n: number) =>
		new ButtonBuilder({
			customId: "rerollAllWinners",
			label: `Reroll all (${n})`,
			style: ButtonStyle.Danger
		})
} as const;

const deleteUnclaimedWinnersButton = {
	customId: "deleteUnclaimedWinners",
	component: () =>
		new ButtonBuilder({
			customId: "deleteUnclaimedWinners",
			label: "Delete unclaimed",
			style: ButtonStyle.Secondary
		})
} as const;

const deleteAllWinnersButton = {
	customId: "deleteAllWinners",
	component: () =>
		new ButtonBuilder({
			customId: "deleteAllWinners",
			label: "Delete all",
			style: ButtonStyle.Danger
		})
} as const;

const enableButton = {
	customId: "enable",
	component: () =>
		new ButtonBuilder({
			customId: "enable",
			label: "Enable",
			style: ButtonStyle.Success
		})
} as const;

const disableButton = {
	customId: "disable",
	component: () =>
		new ButtonBuilder({
			label: "Disable",
			customId: "disable",
			style: ButtonStyle.Danger
		})
} as const;

const roleSelectMenu = {
	customId: "roleSelect",
	component: (min = 1, max = 10) =>
		new RoleSelectMenuBuilder({
			customId: "roleSelect",
			minValues: min,
			maxValues: max
		})
} as const;

const channelSelectMenu = {
	customId: "channelSelect",
	component: ({
		channelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement],
		max = 1,
		min = 1
	}: {
		channelTypes?: Array<ChannelType>;
		max?: number;
		min?: number;
	} = {}) =>
		new ChannelSelectMenuBuilder()
			.setChannelTypes(channelTypes)
			.setCustomId("channelSelect")
			.setMaxValues(max)
			.setMinValues(min)
} as const;

const clearButton = {
	customId: "clear",
	component: () =>
		new ButtonBuilder({
			customId: "clear",
			label: "Clear",
			style: ButtonStyle.Danger
		})
} as const;

const createButton = {
	customId: "create",
	component: () =>
		new ButtonBuilder({
			customId: "create",
			label: "Create",
			style: ButtonStyle.Success
		})
} as const;

const backButton = {
	customId: "back",
	component: () =>
		new ButtonBuilder({
			customId: "back",
			label: "Back",
			style: ButtonStyle.Secondary
		})
} as const;

const acceptAllPrizesButton = {
	customId: "acceptAllPrizes",
	component: () =>
		new ButtonBuilder({
			customId: "acceptAllPrizes",
			emoji: Emojis.Tada,
			label: "Accept all prizes",
			style: ButtonStyle.Success
		})
} as const;

const viewAllEnteredButton = {
	customId: "viewAllEntered",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllEntered",
			label: "View entered",
			style: ButtonStyle.Secondary
		})
} as const;

const viewAllPrizesButton = {
	customId: "viewAllPrizes",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllPrizes",
			label: "View prizes",
			style: ButtonStyle.Secondary
		})
} as const;

const viewAllHostedButton = {
	customId: "viewAllHosted",
	component: () =>
		new ButtonBuilder({
			customId: "viewAllHosted",
			label: "View hosted",
			style: ButtonStyle.Secondary
		})
} as const;

const yesButton = {
	customId: "yes",
	component: (style: ButtonStyle) =>
		new ButtonBuilder()
			.setCustomId("yes")
			.setEmoji(Emojis.V)
			.setStyle(style)
			.setLabel("Yes")
} as const;

const noButton = {
	customId: "no",
	component: (style: ButtonStyle) =>
		new ButtonBuilder()
			.setCustomId("no")
			.setEmoji(Emojis.X)
			.setStyle(style)
			.setLabel("No")
} as const;

const resetLevel4Button = {
	customId: "resetLevel4",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel4")
			.setLabel("Level 4")
			.setStyle(ButtonStyle.Danger)
} as const;

const resetLevel3Button = {
	customId: "resetLevel3",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel3")
			.setLabel("Level 3")
			.setStyle(ButtonStyle.Secondary)
} as const;

const resetLevel2Button = {
	customId: "resetLevel2",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel2")
			.setLabel("Level 2")
			.setStyle(ButtonStyle.Secondary)
} as const;

const resetLevel1Button = {
	customId: "resetLevel1",
	component: () =>
		new ButtonBuilder()
			.setCustomId("resetLevel1")
			.setLabel("Level 1")
			.setStyle(ButtonStyle.Success)
} as const;

const deleteButton = {
	customId: "delete",
	component: () =>
		new ButtonBuilder()
			.setCustomId("delete")
			.setStyle(ButtonStyle.Danger)
			.setLabel("Delete")
} as const;

const endedGiveawayButton = {
	customId: "giveaway-ended",
	component: () =>
		new ButtonBuilder()
			.setCustomId("giveaway-ended")
			.setDisabled(true)
			.setLabel("This giveaway has ended!")
			.setStyle(ButtonStyle.Secondary)
} as const;

const setDateButton = {
	customId: "setDate",
	component: () =>
		new ButtonBuilder()
			.setCustomId("setDate")
			.setLabel("Set date")
			.setStyle(ButtonStyle.Primary)
} as const;

const clearDateButton = {
	customId: "clearDate",
	component: () =>
		new ButtonBuilder()
			.setCustomId("clearDate")
			.setLabel("Clear date")
			.setStyle(ButtonStyle.Primary)
} as const;

const roundDateToNearestHourButton = {
	customId: "roundToNearestHour",
	component: () =>
		new ButtonBuilder()
			.setCustomId("roundToNearestHour")
			.setLabel("Round to nearest hour")
			.setStyle(ButtonStyle.Primary)
} as const;

const endGiveawayButton = {
	customId: "endGiveaway",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endGiveaway")
			.setLabel("End giveaway")
			.setStyle(ButtonStyle.Danger)
} as const;

const endLevelNoneButton = {
	customId: "endLevelNone",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelNone")
			.setLabel("None")
			.setStyle(ButtonStyle.Primary)
} as const;

const endLevelEndButton = {
	customId: "endLevelEnd",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelEnd")
			.setLabel("End")
			.setStyle(ButtonStyle.Primary)
} as const;

const endLevelRollButton = {
	customId: "endLevelRoll",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelRoll")
			.setLabel("Roll")
			.setStyle(ButtonStyle.Primary)
} as const;

const endLevelPublishButton = {
	customId: "endLevelPublish",
	component: () =>
		new ButtonBuilder()
			.setCustomId("endLevelPublish")
			.setLabel("Publish")
			.setStyle(ButtonStyle.Primary)
} as const;

const cancelButton = {
	customId: "cancel",
	component: () =>
		new ButtonBuilder()
			.setCustomId("cancel")
			.setLabel("Cancel")
			.setStyle(ButtonStyle.Secondary)
} as const;

const adjustDateButton = ({
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

const urlButton = ({ label, url }: { label: string; url: string }) => ({
	component: () =>
		new ButtonBuilder()
			.setLabel(label)
			.setStyle(ButtonStyle.Link)
			.setURL(url)
});

const caseLogOptionsButton = {
	customId: "caseLogOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("caseLogOptions")
			.setLabel("Case log options")
			.setStyle(ButtonStyle.Primary)
} as const;

const memberLogOptionsButton = {
	customId: "memberLogOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("memberLogOptions")
			.setLabel("Member log options")
			.setStyle(ButtonStyle.Primary)
} as const;

const pinArchiveOptionsButton = {
	customId: "pinArchiveOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("pinArchiveOptions")
			.setLabel("Pin archive options")
			.setStyle(ButtonStyle.Primary)
} as const;

const protectedChannelsOptionsButton = {
	customId: "protectedChannelsOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("protectedChannelsOptions")
			.setLabel("Protected channels options")
			.setStyle(ButtonStyle.Primary)
} as const;

const reportChannelOptionsButton = {
	customId: "reportChannelOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("reportChannelOptions")
			.setLabel("Report channel options")
			.setStyle(ButtonStyle.Primary)
} as const;

const restrictRolesOptionsButton = {
	customId: "restrictRolesOptions",
	component: () =>
		new ButtonBuilder()
			.setCustomId("restrictRolesOptions")
			.setLabel("Restrict roles options")
			.setStyle(ButtonStyle.Primary)
} as const;

const resetButton = {
	customId: "reset",
	component: (suffix?: string) =>
		new ButtonBuilder()
			.setCustomId("reset")
			.setLabel(suffix ? `Reset ${suffix}` : "Reset")
			.setStyle(ButtonStyle.Danger)
} as const;

// -------------

const selects = {
	channelSelect: channelSelectMenu,
	roleSelect: roleSelectMenu
} as const;

const modals = {
	/**
	 * Children: title, description, numberOfWinners
	 */
	createGiveaway: createOptionsModal,

	/**
	 * Children: newTitle, newDescription, newWinnerQuantity
	 */
	editGiveaway: editOptionsModal
} as const;

const buttons = {
	protectedChannelsOptions: protectedChannelsOptionsButton,
	setPingRolesToAtEveryone: setPingRolesToAtEveryoneButton,
	deleteUnclaimedWinners: deleteUnclaimedWinnersButton,
	roundDateToNearestHour: roundDateToNearestHourButton,
	recallCurrentMessage: recallCurrentMessageButton,
	reportChannelOptions: reportChannelOptionsButton,
	restrictRolesOptions: restrictRolesOptionsButton,
	editCurrentMessage: editCurrentMessageButton,
	reactivateGiveaway: reactivateGiveawayButton,
	pinArchiveOptions: pinArchiveOptionsButton,
	publishingOptions: publishingOptionsButton,
	deleteAllWinners: deleteAllWinnersButton,
	memberLogOptions: memberLogOptionsButton,
	republishWinners: republishWinnersButton,
	rerollAllWinners: rerollAllWinnersButton,
	setRequiredRoles: setRequiredRolesButton,
	unpublishWinners: unpublishWinnersButton,
	acceptAllPrizes: acceptAllPrizesButton,
	endLevelPublish: endLevelPublishButton,
	publishGiveaway: publishGiveawayButton,
	caseLogOptions: caseLogOptionsButton,
	deleteGiveaway: deleteGiveawayButton,
	publishWinners: publishWinnersButton,
	showAllWinners: showAllWinnersButton,
	viewAllEntered: viewAllEnteredButton,
	endedGiveaway: endedGiveawayButton,
	enterGiveaway: enterGiveawayButton,
	rerollWinners: rerollWinnersButton,
	unlockEntries: unlockEntriesButton,
	viewAllHosted: viewAllHostedButton,
	viewAllPrizes: viewAllPrizesButton,
	endLevelNone: endLevelNoneButton,
	endLevelRoll: endLevelRollButton,
	managePrizes: managePrizesButton,
	setPingRoles: setPingRolesButton,
	endGiveaway: endGiveawayButton,
	endLevelEnd: endLevelEndButton,
	lastChannel: lastChannelButton,
	lockEntries: lockEntriesButton,
	resetLevel1: resetLevel1Button,
	resetLevel2: resetLevel2Button,
	resetLevel3: resetLevel3Button,
	resetLevel4: resetLevel4Button,
	rollWinners: rollWinnersButton,
	adjustDate: adjustDateButton,
	endOptions: endOptionsButton,
	clearDate: clearDateButton,
	delete_: deleteButton,
	disable: disableButton,
	setDate: setDateButton,
	cancel: cancelButton,
	create: createButton,
	enable: enableButton,
	clear: clearButton,
	reset: resetButton,
	back: backButton,
	edit: editButton,
	url: urlButton,
	yes: yesButton,
	no: noButton
} as const;

const components = {
	buttons,
	createRows,
	modals,
	selects
} as const;

export default components;
