import { type KickCaseWithIncludes } from "../../typings/cases/index.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseModule } from "#modules/Case.js";
import { CaseType } from "@prisma/client";

export default class KickCaseModule extends CaseModule implements KickCaseWithIncludes {
	public daysPruned = null;
	public expiration = null;
	public newSlowmode = null;
	public originalSlowmode = null;

	public persistant = null;
	public roles = [];
	public targetIds: [string];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.Kick;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Kick) {
			throw new TypeError("Case `type` is not 'Kick'");
		}

		if (data.targetIds.length > 1) {
			throw new TypeError("`targetIds` has more than one id when it should have one");
		}

		if (data.targetUsername === null) {
			throw new TypeError("`targetUsername` is null when it should be present");
		}

		if (data.temporary === null) {
			throw new TypeError("`temporary` is null when it should be present");
		}

		this.targetIds = data.targetIds as [string];
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.type = data.type;
	}
}
