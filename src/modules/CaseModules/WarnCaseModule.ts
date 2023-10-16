import { type WarnCaseWithIncludes } from "../../typings/cases/index.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseModule } from "#modules/Case.js";
import { CaseType } from "@prisma/client";

export default class WarnCaseModule extends CaseModule implements WarnCaseWithIncludes {
	public daysPruned = null;
	public expiration = null;
	public newSlowmode = null;

	public originalSlowmode = null;
	public persistant = null;
	public roles = [];
	public targetIds: [string];
	public targetUsername: string;
	public temporary = null;
	public type: typeof CaseType.Warn;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Warn) {
			throw new TypeError("Case `type` is not 'warn'");
		}

		if (data.targetIds.length > 1) {
			throw new TypeError("`targetIds` has more than one id when it should have one");
		}

		if (data.targetUsername === null) {
			throw new TypeError("`targetUsername` is null when it should be present");
		}

		this.targetIds = data.targetIds as [string];
		this.targetUsername = data.targetUsername;
		this.type = data.type;
	}
}
