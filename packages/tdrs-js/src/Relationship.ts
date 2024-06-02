import { Agent } from "./Agent";
import { ISocialEntity } from "./ISocialEntity";
import { SocialEngine } from "./SocialEngine";
import { SocialRule } from "./SocialRule";
import { StatManager, StatSchema } from "./Stats";
import { Trait, TraitManager, TraitType } from "./Traits";
import { DBQuery } from "@dramalab/repraxis-js";

export class RelationshipSchema {

	public readonly ownerType: string;
	public readonly targetType: string;
	public readonly stats: StatSchema[];
	public readonly traits: string[];

	constructor(
		ownerType: string,
		targetType: string,
		stats: StatSchema[],
		traits: string[]
	) {
		this.ownerType = ownerType;
		this.targetType = targetType;
		this.stats = stats;
		this.traits = traits;
	}
}

export class ActiveSocialRuleEntry {
	public readonly rule: SocialRule;
	public readonly description: string;

	constructor(rule: SocialRule, description: string) {
		this.rule = rule;
		this.description = description;
	}
}

export class Relationship implements ISocialEntity {

	private _activeSocialRules: ActiveSocialRuleEntry[];
	private _engine: SocialEngine;
	private _owner: Agent;
	private _target: Agent;
	private _traits: TraitManager;
	private _stats: StatManager;
	private _relationshipType: Trait | null;

	constructor(engine: SocialEngine, owner: Agent, target: Agent) {
		this._engine = engine;
		this._owner = owner;
		this._target = target;
		this._activeSocialRules = [];
		this._traits = new TraitManager(this);
		this._stats = new StatManager();
		this._relationshipType = null;
	}

	get engine(): SocialEngine { return this._engine; }
	get owner(): Agent { return this._owner; }
	get target(): Agent { return this._target; }
	get traits(): TraitManager { return this._traits; }
	get stats(): StatManager { return this._stats; }
	get relationshipType(): Trait | null { return this._relationshipType; }
	get activeSocialRules(): ActiveSocialRuleEntry[] { return this._activeSocialRules; }

	addTrait(traitId: string, duration = -1, descriptionOverride = ""): boolean {
		const trait = this._engine.traitLibrary.getTrait(traitId);

		// Fail if relationship already has the trait
		if (this._traits.hasTrait(traitId)) return false;

		// Fail if we have a conflicting trait
		if (this._traits.hasConflictingTrait(trait)) return false;

		// Error if trait type is not correct
		if (trait.traitType != TraitType.Relationship) {
			throw new Error(
				`Trait (${traitId}) and is not a relationship trait.`
			);
		}

		let description = trait.description
			.replace("[owner]", this._owner.uid)
			.replace("[target]", this._target.uid);

		if (descriptionOverride != "") {
			description = descriptionOverride;
		}

		// Add trait and apply effects.
		this._traits.addTrait(trait, description, duration);

		// Update the traits listed in RePraxis database.
		this._engine.db.insert(
			`${this._owner.uid}.relationships.${this._target.uid}.traits.{traitID}`
		);

		// Reevaluate social rules for this relationship incase any depend on the new trait.
		this.reevaluateSocialRules();

		return true;
	}

	removeTrait(traitId: string): boolean {
		if (!this._traits.hasTrait(traitId)) return false;

		this._traits.removeTrait(traitId);

		const trait = this._engine.traitLibrary.getTrait(traitId);

		if (this._relationshipType == trait) {
			this._relationshipType = null;
			this._engine.db.delete(
				`${this._owner.uid}.relationships.${this._target.uid}.type!${traitId}`
			);
		}

		this._engine.db.delete(
			`${this._owner.uid}.relationships.${this._target.uid}.traits.${traitId}`
		);

		// Reevaluate social rules for this relationship incase any depend on the removed trait.
		this.reevaluateSocialRules();

		return true;
	}

	setRelationshipType(traitId: string): void {
		if (this._relationshipType != null) {
			this.removeTrait(this._relationshipType.traitId);
		}

		const trait = this._engine.traitLibrary.getTrait(traitId);
		this._relationshipType = trait;
		this._engine.db.insert(
			`${this._owner.uid}.relationships.${this._target.uid}.type!${traitId}`
		);

		this.addTrait(traitId);
	}

	tick(): void {
		this.tickTraits();
	}

	tickTraits(): void {
		const traitInstances = this.traits.traits;

		for (const instance of traitInstances) {
			instance.tick();

			if (instance.hasDuration && instance.duration <= 0) {
				this.removeTrait(instance.traitId);
			}
		}
	}

	reevaluateSocialRules(): void {
		for (const entry of this._activeSocialRules) {
			entry.rule.removeModifiers(this);
		}

		this._activeSocialRules = [];

		for (const rule of this._engine.socialRules) {
			const results = new DBQuery(rule.preconditions).run(
				this._engine.db,
				{ "?owner": this._owner.uid, "?target": this._target.uid },
			);

			if (!results.success) continue;

			rule.applyModifiers(this);

			this._activeSocialRules.push(
				new ActiveSocialRuleEntry(
					rule,
					rule.description
						.replace("[owner]", this._owner.uid)
						.replace("[target]", this._target.uid)
				)
			);
		}
	}

	toString(): string {
		return `Relationship(${this._owner.uid}, ${this._target.uid})`;
	}
}
