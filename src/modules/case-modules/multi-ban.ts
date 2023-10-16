import { type MultiBanCaseWithIncludes } from "../../typings/cases/index.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseModule } from "#modules/case.js";
import { CaseType } from "@prisma/client";

export default class MultiBanCaseModule extends CaseModule implements MultiBanCaseWithIncludes {
	public daysPruned: number;
	public expiration = null;
	public newSlowmode = null;
	public originalSlowmode = null;

	public persistant = null;
	public roles = [];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.MultiBan;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.MultiBan) {
			throw new TypeError("Case `type` is not 'MultiBan'");
		}

		if (data.daysPruned === null) {
			throw new TypeError("`daysPruned` is null when it should be present");
		}

		if (data.targetUsername === null) {
			throw new TypeError("`targetUsername` is null when it should be present");
		}

		if (data.temporary === null) {
			throw new TypeError("`temporary` is null when it should be present");
		}

		this.daysPruned = data.daysPruned;
		this.targetIds = data.targetIds;
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.type = data.type;
	}
}
