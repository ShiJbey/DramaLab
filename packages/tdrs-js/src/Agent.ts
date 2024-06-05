import { SocialEntity } from "./ISocialEntity";
import { ModifierCollection } from "./Modifiers";
import { Relationship } from "./Relationship";
import { SocialEngine } from "./SocialEngine";
import { StatSchema } from "./Stats";
import { TraitType } from "./Traits";


export class AgentSchema {
	public readonly agentType: string;
	public readonly stats: StatSchema[];
	public readonly traits: string[];

	constructor(
		agentType: string,
		stats: StatSchema[],
		traits: string[],
	) {
		this.agentType = agentType;
		this.stats = stats;
		this.traits = traits;
	}
}

export class Agent extends SocialEntity {

	public readonly agentType: string;
	public readonly incomingRelationships: Map<Agent, Relationship>;
	public readonly outgoingRelationships: Map<Agent, Relationship>;
	public readonly relationshipModifiers: ModifierCollection;

	constructor(
		engine: SocialEngine,
		uid: string,
		agentType: string,
	) {
		super(engine, uid);
		this.agentType = agentType;
		this.incomingRelationships = new Map();
		this.outgoingRelationships = new Map();
		this.relationshipModifiers = new ModifierCollection(this);
	}

	addTrait(traitId: string, duration = -1, descriptionOverride = ""): boolean {

		const trait = this.engine.traitLibrary.getTrait(traitId);

		if (trait.traitType != TraitType.Agent) {
			throw new Error(
				`Trait (${traitId}) must be of type 'Agent'.`
			);
		}

		if (!this.traits.canAddTrait(trait)) return false;

		let description = trait.description.replace("[owner]", this.uid);

		if (descriptionOverride != "") {
			description = descriptionOverride;
		}

		this.traits.addTrait(trait, description, duration);

		for (const effect of trait.effects) {
			effect.apply(this);
		}

		this.engine.db.insert(`${this.uid}.traits.${traitId}`);

		this._onTraitAdded.next({ trait: trait });

		this.reevaluateRelationships();

		return true;
	}

	removeTrait(traitId: string): boolean {
		if (!this.traits.hasTrait(traitId)) return false;

		const trait = this.engine.traitLibrary.getTrait(traitId);

		this.traits.removeTrait(traitId);

		for (const effect of trait.effects) {
			effect.remove(this);
		}

		this.engine.db.delete(`${this.uid}.traits.${traitId}`);

		this._onTraitRemoved.next({ trait: trait });

		this.reevaluateRelationships();

		return true;
	}

	tick(): void {
		this.tickTraits();
		this.tickModifiers();
	}

	tickModifiers(): void {
		const modifierInstances = [...this.modifiers.modifiers];

		for (const modifier of modifierInstances) {
			modifier.update(this);

			if (modifier.hasExpired(this)) {
				this.modifiers.remove(modifier);
			}
		}

		const relModifierInstances = [...this.relationshipModifiers.modifiers];

		for (const modifier of relModifierInstances) {
			modifier.update(this);

			if (modifier.hasExpired(this)) {
				this.modifiers.remove(modifier);
			}
		}
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

	reevaluateRelationships(): void {
		for (const relationship of this.outgoingRelationships.values()) {
			relationship.reevaluateSocialRules();
		}

		for (const relationship of this.incomingRelationships.values()) {
			relationship.reevaluateSocialRules();
		}
	}

	ReevaluateRelationship(target: Agent): void {
		const relationship = this.outgoingRelationships.get(target);

		if (relationship === undefined) throw new Error(`Cannot find relationship from ${this.uid} to ${target.uid}`);

		relationship.reevaluateSocialRules();
	}

	toString(): string {
		return this.uid;
	}
}
