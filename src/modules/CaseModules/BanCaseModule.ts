import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type BanCaseWithIncludes } from "../../typings/cases/index.js";

export default class BanCaseModule
	extends CaseModule
	implements BanCaseWithIncludes
{
	public daysPruned: number;
	public targetIds: [string];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.Ban;

	public expiration = null;
	public originalSlowmode = null;
	public persistant = null;
	public roles = [];
	public newSlowmode = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Ban) {
			throw new TypeError("Case `type` is not 'Ban'");
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
