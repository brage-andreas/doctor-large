import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type RestrictCaseWithIncludes } from "../../typings/cases/index.js";

export default class RestrictCaseModule
	extends CaseModule
	implements RestrictCaseWithIncludes
{
	public targetIds: [string];
	public targetUsername: string;
	public type: typeof CaseType.Restrict;

	public daysPruned = null;
	public expiration = null;
	public originalSlowmode = null;
	public persistant = null;
	public roles = [];
	public temporary = null;
	public newSlowmode = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Restrict) {
			throw new TypeError("Case `type` is not 'Restrict'");
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

		this.targetIds = data.targetIds as [string];
		this.targetUsername = data.targetUsername;
		this.type = data.type;
	}
}
