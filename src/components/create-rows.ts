import {
	type CreateRows,
	type CreateRowsCompatibleAPIComponent,
	type CreateRowsCompatibleRow,
	type CreateRowsInput,
} from "#typings";
import { type APIActionRowComponent, type APIButtonComponent, ComponentType } from "discord.js";

// Gloriously over-engineered

/**
 * Takes a number and splits it into an array of `5` with the excess trailing.
 * @example
 * const example1 = splitToFives(8);
 * console.log(example1) // [5, 3]
 *
 * const example2 = splitToFives(22);
 * console.log(example1) // [5, 5, 5, 5, 2]
 */
const splitToFives = (number: number) => {
	if (number <= 5) {
		return [number];
	}

	const array: Array<number> = [];
	let n = number;

	for (let index = 0; index < Math.ceil(number / 5); index++) {
		if (n >= 5) {
			array.push(5);
			n -= 5;
		} else {
			array.push(n);

			break;
		}
	}

	return array.slice(0, 5);
};

const getCreateRows =
	(lengthRow1: number, lengthRow2: number, lengthRow3: number, lengthRow4: number, lengthRow5: number) =>
	(...components: CreateRowsInput): Array<CreateRowsCompatibleRow> => {
		const rows: Array<APIActionRowComponent<CreateRowsCompatibleAPIComponent>> = [];

		const maxes = [
			...splitToFives(lengthRow1),
			...splitToFives(lengthRow2),
			...splitToFives(lengthRow3),
			...splitToFives(lengthRow4),
			...splitToFives(lengthRow5),
		].slice(0, 5);

		for (const componentOrObject of components.slice(0, 25)) {
			if (!componentOrObject) {
				continue;
			}

			const index = rows.length - 1;
			const max = maxes[index];

			const component = "component" in componentOrObject ? componentOrObject.component() : componentOrObject;

			const lastRow = rows.at(-1) ?? {
				components: [],
				type: ComponentType.ActionRow,
			};

			const lastRowIsFullOf = {
				buttons: max <= lastRow.components.length,
				others: lastRow.components.some((c) => c.type !== ComponentType.Button),
			};

			if (lastRowIsFullOf.buttons || lastRowIsFullOf.others || component.type !== ComponentType.Button) {
				rows.push({
					components: [component],
					type: ComponentType.ActionRow,
				});

				continue;
			}

			if (lastRow.components.length > 0) {
				rows.pop();
			}

			const last = lastRow as APIActionRowComponent<APIButtonComponent>;

			last.components.push(component);

			rows.push(last);
		}

		return rows.slice(0, 5) as Array<CreateRowsCompatibleRow>;
	};

const createRows = getCreateRows(5, 5, 5, 5, 5) as CreateRows;

createRows.uniform = (length: number | undefined = 5) => getCreateRows(length, length, length, length, length);

createRows.specific = (
	lengthRow1: number | undefined = 5,
	lengthRow2: number | undefined = 5,
	lengthRow3: number | undefined = 5,
	lengthRow4: number | undefined = 5,
	lengthRow5: number | undefined = 5
) => getCreateRows(lengthRow1, lengthRow2, lengthRow3, lengthRow4, lengthRow5);

export default createRows;
