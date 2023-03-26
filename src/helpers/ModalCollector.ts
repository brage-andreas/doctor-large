import {
	InteractionCollector,
	InteractionType,
	type APIModalInteractionResponseCallbackData,
	type ContextMenuCommandInteraction,
	type Interaction,
	type ModalSubmitInteraction,
	type ModalSubmitInteractionCollectorOptions
} from "discord.js";

export const modalId = () => `modal-${Date.now().toString().slice(-5)}`;

export const ModalCollector = (
	interaction:
		| ContextMenuCommandInteraction<"cached">
		| Interaction<"cached">,
	modal: APIModalInteractionResponseCallbackData,
	collectorOptions?: Omit<
		ModalSubmitInteractionCollectorOptions<ModalSubmitInteraction>,
		"channel" | "filter" | "guild" | "interactionType" | "max"
	>
) =>
	new InteractionCollector<ModalSubmitInteraction<"cached">>(
		interaction.client,
		{
			interactionType: InteractionType.ModalSubmit,
			filter: (modalInteraction) =>
				modalInteraction.user.id === interaction.user.id &&
				modalInteraction.customId === modal.custom_id,
			channel: interaction.channelId ?? undefined,
			guild: interaction.guildId,
			time: 60_000,
			max: 1,
			...collectorOptions
		}
	);
