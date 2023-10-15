import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type SoftbanCaseWithIncludes } from "../../typings/cases/index.js";

export default class SoftbanCaseModule
	extends CaseModule
	implements SoftbanCaseWithIncludes
{
	public daysPruned: number;
	public targetIds: [string];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.Softban;

	public expiration = null;
	public originalSlowmode = null;
	public persistant = null;
	public roles = [];
	public newSlowmode = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Softban) {
			throw new TypeError("Case `type` is not 'Softban'");
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
