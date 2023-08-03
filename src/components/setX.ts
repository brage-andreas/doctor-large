import {
	type ComponentObjectWithNoParams,
	type CreateRowsCompatibleAPIComponent,
	type CustomIdCompatibleButtonStyle
} from "#typings";
import { type APIButtonComponentWithCustomId } from "discord.js";

export const disabled = <T extends CreateRowsCompatibleAPIComponent>(
	componentOrObject: ComponentObjectWithNoParams<T> | T,
	disabled: boolean | null | undefined = true
): T => {
	const component =
		"component" in componentOrObject
			? componentOrObject.component()
			: componentOrObject;

	component.disabled = disabled ?? undefined;

	return component;
};

export const style = (
	componentOrObject:
		| APIButtonComponentWithCustomId
		| ComponentObjectWithNoParams<APIButtonComponentWithCustomId>,
	style: CustomIdCompatibleButtonStyle
) => {
	const component =
		"component" in componentOrObject
			? componentOrObject.component()
			: componentOrObject;

	component.style = style;

	return component;
};
