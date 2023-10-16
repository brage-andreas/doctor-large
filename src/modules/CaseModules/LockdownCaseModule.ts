import { type LockdownCaseWithIncludes } from "../../typings/cases/index.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseModule } from "#modules/Case.js";
import { CaseType } from "@prisma/client";

export default class LockdownCaseModule extends CaseModule implements LockdownCaseWithIncludes {
	public daysPruned = null;
	public expiration: Date;
	public newLockdown = null;

	public originalLockdown = null;
	public persistant = null;
	public roles = [];
	public targetIds: [string];
	public targetUsername = null;
	public temporary = null;
	public type: typeof CaseType.Lockdown;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Lockdown) {
			throw new TypeError("Case `type` is not 'Lockdown'");
		}

		if (data.targetIds.length > 1) {
			throw new TypeError("`targetIds` has more than one id when it should have one");
		}

		if (data.expiration === null) {
			throw new TypeError("`expiration` is null when it should be present");
		}

		this.targetIds = data.targetIds as [string];
		this.expiration = data.expiration;
		this.type = data.type;
	}
}
