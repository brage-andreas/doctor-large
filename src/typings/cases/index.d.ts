import { type CaseWithIncludes } from "#typings";
import { type CaseType } from "@prisma/client";

export interface WarnCaseWithIncludes
	extends Omit<
		CaseWithIncludes,
		"daysPruned" | "expiration" | "newSlowmode" | "originalSlowmode" | "persistant" | "roles" | "temporary"
	> {
	targetIds: [string];
	targetUsername: string;
	type: typeof CaseType.Warn;
}

export interface RestrictCaseWithIncludes
	extends Omit<
		CaseWithIncludes,
		"daysPruned" | "expiration" | "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"
	> {
	targetIds: [string];
	targetUsername: string;
	type: typeof CaseType.Restrict;
}

export interface UnrestrictCaseWithIncludes
	extends Omit<
		CaseWithIncludes,
		"daysPruned" | "expiration" | "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"
	> {
	targetIds: [string];
	targetUsername: string;
	type: typeof CaseType.Unrestrict;
}

export interface MuteCaseWithIncludes
	extends Omit<CaseWithIncludes, "daysPruned" | "newSlowmode" | "originalSlowmode" | "persistant"> {
	expiration: Date;
	targetIds: [string];
	targetUsername: string;
	temporary: boolean;
	type: typeof CaseType.Mute;
}

export interface UnmuteCaseWithIncludes
	extends Omit<CaseWithIncludes, "daysPruned" | "newSlowmode" | "originalSlowmode" | "persistant"> {
	expiration: Date;
	targetIds: [string];
	targetUsername: string;
	temporary: boolean;
	type: typeof CaseType.Unmute;
}

export interface KickCaseWithIncludes
	extends Omit<CaseWithIncludes, "daysPruned" | "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"> {
	targetIds: [string];
	targetUsername: string;
	temporary: boolean;
	type: typeof CaseType.Kick;
}

export interface SoftbanCaseWithIncludes
	extends Omit<CaseWithIncludes, "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"> {
	daysPruned: number;
	targetIds: [string];
	targetUsername: string;
	temporary: boolean;
	type: typeof CaseType.Softban;
}

export interface BanCaseWithIncludes
	extends Omit<CaseWithIncludes, "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"> {
	daysPruned: number;
	targetIds: [string];
	targetUsername: string;
	temporary: boolean;
	type: typeof CaseType.Ban;
}

export interface MultiBanCaseWithIncludes
	extends Omit<CaseWithIncludes, "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"> {
	daysPruned: number;
	temporary: boolean;
	type: typeof CaseType.MultiBan;
}

export interface UnbanCaseWithIncludes
	extends Omit<CaseWithIncludes, "newSlowmode" | "originalSlowmode" | "persistant" | "temporary"> {
	daysPruned: number;
	targetIds: [string];
	targetUsername: string;
	temporary: boolean;
	type: typeof CaseType.Unban;
}

export interface SlowmodeCaseWithIncludes
	extends Omit<CaseWithIncludes, "daysPruned" | "roles" | "targetUsername" | "temporary"> {
	expiration: Date;
	newSlowmode: number;
	originalSlowmode: number;
	persistant: boolean;
	targetIds: [string];
	type: typeof CaseType.Slowmode;
}

export interface LockdownCaseWithIncludes
	extends Omit<
		CaseWithIncludes,
		"daysPruned" | "newSlowmode" | "originalSlowmode" | "persistant" | "roles" | "targetUsername" | "temporary"
	> {
	expiration: Date;
	targetIds: [string];
	type: typeof CaseType.Lockdown;
}
