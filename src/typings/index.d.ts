export type EventFn = (...args: Array<unknown>) => Promise<unknown> | unknown;

export interface EventImport {
	run: EventFn;
}
