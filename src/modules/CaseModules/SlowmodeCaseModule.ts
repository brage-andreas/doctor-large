import type CaseManager from "#database/case.js";
import { CaseModule } from "#modules/Case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseType } from "@prisma/client";
import { type SlowmodeCaseWithIncludes } from "../../typings/cases/index.js";

export default class SlowmodeCaseModule
	extends CaseModule
	implements SlowmodeCaseWithIncludes
{
	public expiration: Date;
	public originalSlowmode: number;
	public newSlowmode: number;
	public persistant: boolean;
	public targetIds: [string];
	public type: typeof CaseType.Slowmode;

	public daysPruned = null;
	public roles = [];
	public targetUsername = null;
	public temporary = null;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Slowmode) {
			throw new TypeError("Case `type` is not 'Slowmode'");
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

		if (data.originalSlowmode === null) {
			throw new TypeError(
				"`originalSlowmode` is null when it should be present"
			);
		}

		if (data.newSlowmode === null) {
			throw new TypeError(
				"`newSlowmode` is null when it should be present"
			);
		}

		if (data.persistant === null) {
			throw new TypeError(
				"`persistant` is null when it should be present"
			);
		}

		this.targetIds = data.targetIds as [string];
		this.expiration = data.expiration;
		this.originalSlowmode = data.originalSlowmode;
		this.newSlowmode = data.originalSlowmode;
		this.persistant = data.persistant;
		this.type = data.type;
	}
}
