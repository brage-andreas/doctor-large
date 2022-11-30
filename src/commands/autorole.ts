import {
	ApplicationCommandOptionType,
	Interaction,
	type ApplicationCommandData
} from "discord.js";
import { Command } from "../typings/index.js";

ApplicationCommandOptionType;

const data: ApplicationCommandData = {};

const run = async (interaction: Interaction) => {};

export const getCommand: () => Command = () => ({
	data,
	run
});
