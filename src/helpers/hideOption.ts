import {
	ApplicationCommandOptionType,
	type APIApplicationCommandBasicOption
} from "discord.js";

const hideOption: APIApplicationCommandBasicOption = {
	description: "Whether to hide this command (True)",
	name: "hide",
	type: ApplicationCommandOptionType.Boolean
};

export default hideOption;
