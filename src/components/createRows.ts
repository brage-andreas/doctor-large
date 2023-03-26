import {
	type ComponentObjectWithNoParams,
	type CreateRowsCompatibleAPIComponent,
	type CreateRowsCompatibleRow
} from "#typings";
import {
	ComponentType,
	type APIActionRowComponent,
	type APIButtonComponent
} from "discord.js";

export const createRows = (
	...components: Array<
		| ComponentObjectWithNoParams
		| CreateRowsCompatibleAPIComponent
		| null
		| undefined
	>
): Array<CreateRowsCompatibleRow> => {
	const rows: Array<CreateRowsCompatibleRow> = [];

	for (const componentOrObject of components) {
		if (!componentOrObject) {
			continue;
		}

		const component =
			"component" in componentOrObject
				? componentOrObject.component()
				: componentOrObject;

		if (component.type !== ComponentType.Button) {
			rows.push({
				components: [component],
				type: ComponentType.ActionRow
			});

			continue;
		}

		let last = rows.at(-1) ?? {
			components: [],
			type: ComponentType.ActionRow
		};

		if (last.components.some((c) => c.type !== ComponentType.Button)) {
			last = {
				components: [],
				type: ComponentType.ActionRow
			};
		} else if (last.components.length) {
			rows.pop();
		}

		last = last as APIActionRowComponent<APIButtonComponent>;

		if (last.components.length === 5) {
			rows.push({
				components: [component],
				type: ComponentType.ActionRow
			});
		} else {
			last.components.push(component);

			rows.push(last);
		}
	}

	return rows.slice(0, 5);
};
