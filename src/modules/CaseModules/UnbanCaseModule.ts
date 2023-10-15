import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type UnbanCaseWithIncludes } from "../../typings/cases/index.js";

export default class UnbanCaseModule
	extends CaseModule
	implements UnbanCaseWithIncludes
{
	public daysPruned: number;
	public targetIds: [string];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.Unban;

	public expiration = null;
	public originalSlowmode = null;
	public persistant = null;
	public roles = [];
	public newSlowmode = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Unban) {
			throw new TypeError("Case `type` is not 'Unban'");
		}

		if (data.daysPruned === null) {
			throw new TypeError(
				"`daysPruned` is null when it should be present"
			);
		}

		if (data.targetIds.length > 1) {
			throw new TypeError(
				"`targetIds` has more than one id when it should have one"
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
		this.targetIds = data.targetIds as [string];
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.type = data.type;
	}
}
