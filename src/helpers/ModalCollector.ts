import {
	type APIModalInteractionResponseCallbackData,
	type ContextMenuCommandInteraction,
	type Interaction,
	InteractionCollector,
	InteractionType,
	type ModalSubmitInteraction,
	type ModalSubmitInteractionCollectorOptions,
} from "discord.js";

export const modalId = () => `modal-${Date.now().toString().slice(-5)}`;

export const ModalCollector = (
	interaction: ContextMenuCommandInteraction<"cached"> | Interaction<"cached">,
	modal: APIModalInteractionResponseCallbackData,
	collectorOptions?: Omit<
		ModalSubmitInteractionCollectorOptions<ModalSubmitInteraction>,
		"channel" | "filter" | "guild" | "interactionType" | "max"
	>
) =>
	new InteractionCollector<ModalSubmitInteraction<"cached">>(interaction.client, {
		channel: interaction.channelId ?? undefined,
		filter: (modalInteraction) =>
			modalInteraction.user.id === interaction.user.id && modalInteraction.customId === modal.custom_id,
		guild: interaction.guildId,
		interactionType: InteractionType.ModalSubmit,
		max: 1,
		time: 60_000,
		...collectorOptions,
	});
