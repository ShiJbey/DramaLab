import { IModifier } from "./Modifiers";

export class SocialRule {
	public readonly ruleId: string;
	public readonly description: string;
	public readonly preconditions: string[];
	public readonly modifiers: IModifier[];

	constructor(
		ruleId: string,
		description: string,
		preconditions: string[],
		modifiers: IModifier[]
	) {
		this.ruleId = ruleId;
		this.description = description;
		this.preconditions = preconditions;
		this.modifiers = modifiers;
	}
}

export class SocialRuleLibrary {

	private readonly _rules: Map<string, SocialRule>;

	constructor() {
		this._rules = new Map();
	}

	get rules(): SocialRule[] { return [...this._rules.values()]; }

	addRule(rule: SocialRule): void {
		this._rules.set(rule.ruleId, rule);
	}

	hasRule(ruleId: string): boolean {
		return this._rules.has(ruleId);
	}

	getRule(ruleId: string): SocialRule {
		const rule = this._rules.get(ruleId);

		if (rule === undefined) {
			throw new Error(`Social rule not found for ${ruleId}`);
		}

		return rule;
	}
}
