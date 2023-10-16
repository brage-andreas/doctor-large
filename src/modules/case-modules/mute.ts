import { type MuteCaseWithIncludes } from "../../typings/cases/index.js";
import type CaseManager from "#database/case.js";
import { type CaseWithIncludes } from "#typings";
import { CaseModule } from "#modules/case.js";
import { CaseType } from "@prisma/client";

export default class MuteCaseModule extends CaseModule implements MuteCaseWithIncludes {
	public daysPruned = null;
	public expiration: Date;
	public newSlowmode = null;
	public originalSlowmode = null;
	public persistant = null;

	public targetIds: [string];
	public targetUsername: string;
	public temporary: boolean;
	public type: typeof CaseType.Mute;

	public constructor(manager: CaseManager, data: CaseWithIncludes) {
		super(manager, data);

		if (data.type !== CaseType.Mute) {
			throw new TypeError("Case `type` is not 'Mute'");
		}

		if (data.expiration === null) {
			throw new TypeError("`expiration` is null when it should be present");
		}

		if (data.targetIds.length > 1) {
			throw new TypeError("`targetIds` has more than one id when it should have one");
		}

		if (data.targetUsername === null) {
			throw new TypeError("`targetUsername` is null when it should be present");
		}

		if (data.temporary === null) {
			throw new TypeError("`temporary` is null when it should be present");
		}

		this.expiration = data.expiration;
		this.targetIds = data.targetIds as [string];
		this.targetUsername = data.targetUsername;
		this.temporary = data.temporary;
		this.type = data.type;
	}
}
