import { Agent } from "./Agent";
import { SocialEntity } from "./ISocialEntity";
import { Modifier, RelationshipModifier } from "./Modifiers";
import { SocialEngine } from "./SocialEngine";
import { StatSchema } from "./Stats";
import { Trait, TraitType } from "./Traits";

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

export class Relationship extends SocialEntity {

	public readonly owner: Agent;
	public readonly target: Agent;
	private _relationshipType: Trait | null;

	constructor(engine: SocialEngine, owner: Agent, target: Agent) {
		super(engine, `${owner.uid}_${target.uid}`)
		this.owner = owner;
		this.target = target;
		this._relationshipType = null;
	}

	get relationshipType(): Trait | null { return this._relationshipType; }

	addTrait(traitId: string, duration = -1, descriptionOverride = ""): boolean {
		const trait = this.engine.traitLibrary.getTrait(traitId);

		if (trait.traitType != TraitType.Relationship) {
			throw new Error(
				`Trait (${traitId}) and is not a relationship trait.`
			);
		}

		if (!this.traits.canAddTrait(trait)) return false;

		let description = trait.description
			.replace("[owner]", this.owner.uid)
			.replace("[target]", this.target.uid);

		if (descriptionOverride != "") {
			description = descriptionOverride;
		}

		// Add trait
		this.traits.addTrait(trait, description, duration);

		for (const effect of trait.effects) {
			effect.apply(this);
		}

		// Update the traits listed in RePraxis database.
		this.engine.db.insert(
			`${this.owner.uid}.relationships.${this.target.uid}.traits.{traitID}`
		);

		this._onTraitAdded.next({ trait: trait });

		// Reevaluate social rules for this relationship incase any depend on the new trait.
		this.reevaluateSocialRules();

		return true;
	}

	removeTrait(traitId: string): boolean {
		if (!this.traits.hasTrait(traitId)) return false;

		const trait = this.engine.traitLibrary.getTrait(traitId);

		this.traits.removeTrait(traitId);

		for (const effect of trait.effects) {
			effect.remove(this);
		}

		if (this._relationshipType == trait) {
			this._relationshipType = null;
			this.engine.db.delete(
				`${this.owner.uid}.relationships.${this.target.uid}.type!${traitId}`
			);
		}

		this.engine.db.delete(
			`${this.owner.uid}.relationships.${this.target.uid}.traits.${traitId}`
		);

		this._onTraitRemoved.next({ trait: trait });

		// Reevaluate social rules for this relationship incase any depend on the removed trait.
		this.reevaluateSocialRules();

		return true;
	}

	setRelationshipType(traitId: string): void {
		if (this._relationshipType != null) {
			this.removeTrait(this._relationshipType.traitId);
		}

		const trait = this.engine.traitLibrary.getTrait(traitId);
		this._relationshipType = trait;
		this.engine.db.insert(
			`${this.owner.uid}.relationships.${this.target.uid}.type!${traitId}`
		);

		this.addTrait(traitId);
	}

	tick(): void {
		this.tickTraits();
		this.tickModifiers();
		this.reevaluateSocialRules();
	}

	tickTraits(): void {
		const traitInstances = this.traits.traits;

		for (const instance of traitInstances) {
			instance.tick();

			if (instance.hasDuration && instance.duration <= 0) {
				this.removeTrait(instance.trait.traitId);
			}
		}
	}

	tickModifiers(): void {
		const modifierInstances = [...this.modifiers.modifiers];

		for (const modifier of modifierInstances) {
			modifier.update(this);

			if (modifier.hasExpired(this)) {
				this.modifiers.remove(modifier);
			}
		}
	}

	reevaluateSocialRules(): void {
		// Check all the target's incoming relationship modifiers
		for (const entry of this.owner.relationshipModifiers.modifiers) {
			if (entry instanceof RelationshipModifier) {
				if (entry.direction != "incoming") continue;

				for (const effect of entry.effects) {
					effect.remove(this);
				}

				const isValid = entry.checkPreconditions(this);

				if (isValid) {
					for (const effect of entry.effects) {
						effect.apply(this);
					}
				}
			}
		}

		// Check all the owner's outgoing relationship modifiers
		for (const entry of this.owner.relationshipModifiers.modifiers) {
			if (entry instanceof RelationshipModifier) {
				if (entry.direction != "outgoing") continue;

				for (const effect of entry.effects) {
					effect.remove(this);
				}

				const isValid = entry.checkPreconditions(this);
				if (isValid) {
					for (const effect of entry.effects) {
						effect.apply(this);
					}
				}
			}
		}
	}
}
