import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type LockdownCaseWithIncludes } from "../../typings/cases/index.js";

export default class LockdownCaseModule
	extends CaseModule
	implements LockdownCaseWithIncludes
{
	public expiration: Date;
	public targetIds: [string];
	public type: typeof CaseType.Lockdown;

	public daysPruned = null;
	public newLockdown = null;
	public originalLockdown = null;
	public persistant = null;
	public roles = [];
	public targetUsername = null;
	public temporary = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Lockdown) {
			throw new TypeError("Case `type` is not 'Lockdown'");
		}

		if (data.targetIds.length > 1) {
			throw new TypeError(
				"`targetIds` has more than one id when it should have one"
			);
		}

		if (data.expiration === null) {
			throw new TypeError(
				"`expiration` is null when it should be present"
			);
		}

		this.targetIds = data.targetIds as [string];
		this.expiration = data.expiration;
		this.type = data.type;
	}
}
