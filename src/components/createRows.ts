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

interface CreateRows {
	(
		...components: Array<
			| ComponentObjectWithNoParams
			| CreateRowsCompatibleAPIComponent
			| null
			| undefined
		>
	): Array<CreateRowsCompatibleRow>;

	split(length: number): {
		(
			...components: Array<
				| ComponentObjectWithNoParams
				| CreateRowsCompatibleAPIComponent
				| null
				| undefined
			>
		): Array<CreateRowsCompatibleRow>;
	};

	specific(
		lengthRow1: number,
		lengthRow2: number,
		lengthRow3: number,
		lengthRow4: number,
		lengthRow5: number
	): {
		(
			...components: Array<
				| ComponentObjectWithNoParams
				| CreateRowsCompatibleAPIComponent
				| null
				| undefined
			>
		): Array<CreateRowsCompatibleRow>;
	};
}

const getCurrentRowMax = (
	index: number,
	lengthRow1?: number,
	lengthRow2?: number,
	lengthRow3?: number,
	lengthRow4?: number,
	lengthRow5?: number
) => {
	switch (index) {
		case 1: {
			return lengthRow1 ?? 5;
		}

		case 2: {
			return lengthRow2 ?? 5;
		}

		case 3: {
			return lengthRow3 ?? 5;
		}

		case 4: {
			return lengthRow4 ?? 5;
		}

		case 5: {
			return lengthRow5 ?? 5;
		}

		default: {
			return 5;
		}
	}
};

const getCreateRows =
	(
		length?: number,
		lengthRow2?: number,
		lengthRow3?: number,
		lengthRow4?: number,
		lengthRow5?: number
	) =>
	(
		...components: Array<
			| ComponentObjectWithNoParams
			| CreateRowsCompatibleAPIComponent
			| null
			| undefined
		>
	): Array<CreateRowsCompatibleRow> => {
		const rows: Array<CreateRowsCompatibleRow> = [];

		for (const componentOrObject of components.slice(0, 25)) {
			if (!componentOrObject) {
				continue;
			}

			const component =
				"component" in componentOrObject
					? componentOrObject.component()
					: componentOrObject;

			const lastRow = rows.at(-1) ?? {
				components: [],
				type: ComponentType.ActionRow
			};

			const max = getCurrentRowMax(
				rows.length + 1,
				length,
				lengthRow2,
				lengthRow3,
				lengthRow4,
				lengthRow5
			);

			const lastRowIsFullOf = {
				buttons: max <= lastRow.components.length,
				others: lastRow.components.some(
					(c) => c.type !== ComponentType.Button
				)
			};

			if (
				lastRowIsFullOf.buttons ||
				lastRowIsFullOf.others ||
				component.type !== ComponentType.Button
			) {
				rows.push({
					components: [component],
					type: ComponentType.ActionRow
				});

				continue;
			}

			if (lastRow.components.length) {
				rows.pop();
			}

			const last = lastRow as APIActionRowComponent<APIButtonComponent>;

			last.components.push(component);

			rows.push(last);
		}

		return rows.slice(0, 5);
	};

const createRows = <CreateRows>getCreateRows();

createRows.specific = (
	lengthRow1: number,
	lengthRow2: number,
	lengthRow3: number,
	lengthRow4: number,
	lengthRow5: number
) => getCreateRows(lengthRow1, lengthRow2, lengthRow3, lengthRow4, lengthRow5);
