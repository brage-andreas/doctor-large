import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type MultiBanCaseWithIncludes } from "../../typings/cases/index.js";

export default class MultiBanCaseModule
	extends CaseModule
	implements MultiBanCaseWithIncludes
{
	public daysPruned: number;
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.MultiBan;

	public expiration = null;
	public originalSlowmode = null;
	public persistant = null;
	public roles = [];
	public newSlowmode = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.MultiBan) {
			throw new TypeError("Case `type` is not 'MultiBan'");
		}

		if (data.daysPruned === null) {
			throw new TypeError(
				"`daysPruned` is null when it should be present"
			);
		}

		if (data.targetUsername === null) {
			throw new TypeError(
				"`targetUsername` is null when it should be present"
			);
		}

		if (data.temporary === null) {
			throw new TypeError(
				"`temporary` is null when it should be present"
			);
		}

		this.daysPruned = data.daysPruned;
		this.targetIds = data.targetIds;
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.type = data.type;
	}
}
