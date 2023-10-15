import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type UnmuteCaseWithIncludes } from "../../typings/cases/index.js";

export default class UnmuteCaseModule
	extends CaseModule
	implements UnmuteCaseWithIncludes
{
	public expiration: Date;
	public targetIds: [string];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.Unmute;

	public daysPruned = null;
	public originalSlowmode = null;
	public persistant = null;
	public newSlowmode = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Unmute) {
			throw new TypeError("Case `type` is not 'Unmute'");
		}

		if (data.expiration === null) {
			throw new TypeError(
				"`expiration` is null when it should be present"
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

		this.expiration = data.expiration;
		this.targetIds = data.targetIds as [string];
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.type = data.type;
	}
}
