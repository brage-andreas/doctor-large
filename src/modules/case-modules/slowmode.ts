import { type SlowmodeCaseWithIncludes } from "../../typings/cases/index.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseModule } from "#modules/case.js";
import { CaseType } from "@prisma/client";

export default class SlowmodeCaseModule extends CaseModule implements SlowmodeCaseWithIncludes {
	public daysPruned = null;
	public expiration: Date;
	public newSlowmode: number;
	public originalSlowmode: number;
	public persistant: boolean;
	public roles = [];

	public targetIds: [string];
	public targetUsername = null;
	public temporary = null;
	public type: typeof CaseType.Slowmode;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Slowmode) {
			throw new TypeError("Case `type` is not 'Slowmode'");
		}

		if (data.targetIds.length > 1) {
			throw new TypeError("`targetIds` has more than one id when it should have one");
		}

		if (data.expiration === null) {
			throw new TypeError("`expiration` is null when it should be present");
		}

		if (data.originalSlowmode === null) {
			throw new TypeError("`originalSlowmode` is null when it should be present");
		}

		if (data.newSlowmode === null) {
			throw new TypeError("`newSlowmode` is null when it should be present");
		}

		if (data.persistant === null) {
			throw new TypeError("`persistant` is null when it should be present");
		}

		this.targetIds = data.targetIds as [string];
		this.expiration = data.expiration;
		this.originalSlowmode = data.originalSlowmode;
		this.newSlowmode = data.originalSlowmode;
		this.persistant = data.persistant;
		this.type = data.type;
	}
}
