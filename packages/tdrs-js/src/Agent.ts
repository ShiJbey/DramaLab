import { ISocialEntity } from "./ISocialEntity";
import { Relationship } from "./Relationship";
import { SocialEngine } from "./SocialEngine";
import { StatManager, StatSchema } from "./Stats";
import { TraitManager, TraitType } from "./Traits";


export class AgentSchema {
	private _agentType: string;
	private _stats: StatSchema[];
	private _traits: string[];

	constructor(
		agentType: string,
		stats: StatSchema[],
		traits: string[],
	) {
		this._agentType = agentType;
		this._stats = stats;
		this._traits = traits;
	}

	get agentType(): string { return this._agentType; }
	get stats(): StatSchema[] { return this._stats; }
	get traits(): string[] { return this._traits; }
}

export class Agent implements ISocialEntity {
	private _uid: string;
	private _agentType: string;
	private _engine: SocialEngine;
	private _traits: TraitManager;
	private _stats: StatManager;
	private _incomingRelationships: Map<Agent, Relationship>;
	private _outgoingRelationships: Map<Agent, Relationship>;

	constructor(
		engine: SocialEngine,
		uid: string,
		agentType: string,
	) {
		this._uid = uid;
		this._engine = engine;
		this._agentType = agentType;
		this._traits = new TraitManager(this);
		this._stats = new StatManager();
		this._incomingRelationships = new Map();
		this._outgoingRelationships = new Map();
	}

	get uid(): string { return this._uid; }
	get agentType(): string { return this._agentType; }
	get engine(): SocialEngine { return this._engine; }
	get traits(): TraitManager { return this._traits; }
	get stats(): StatManager { return this._stats; }
	get incomingRelationships(): Map<Agent, Relationship> { return this._incomingRelationships; }
	get outgoingRelationships(): Map<Agent, Relationship> { return this._outgoingRelationships; }

	addTrait(traitId: string, duration = -1, descriptionOverride = ""): boolean {

		const trait = this.engine.traitLibrary.getTrait(traitId);

		if (this._traits.hasTrait(traitId)) return false;

		if (this._traits.hasConflictingTrait(trait)) return false;

		if (trait.traitType != TraitType.Agent) {
			throw new Error(
				`Trait (${traitId}) must be of type 'Agent'.`
			);
		}

		let description = trait.description.replace("[owner]", this.uid);

		if (descriptionOverride != "") {
			description = descriptionOverride;
		}

		this._traits.addTrait(trait, description, duration);

		this._engine.db.insert(`${this.uid}.traits.${traitId}`);

		this.reevaluateRelationships();

		return true;
	}

	removeTrait(traitId: string): boolean {
		if (!this.traits.hasTrait(traitId)) return false;

		this.traits.removeTrait(traitId);

		this.engine.db.delete(`${this.uid}.traits.${traitId}`);

		this.reevaluateRelationships();

		return true;
	}

	tick(): void {
		this.tickTraits();
		this.reevaluateRelationships();
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

	reevaluateRelationships(): void {
		for (const relationship of this._outgoingRelationships.values()) {
			relationship.reevaluateSocialRules();
		}

		for (const relationship of this._incomingRelationships.values()) {
			relationship.reevaluateSocialRules();
		}
	}

	ReevaluateRelationship(target: Agent): void {
		const relationship = this._outgoingRelationships.get(target);

		if (relationship === undefined) throw new Error(`Cannot find relationship from ${this.uid} to ${target.uid}`);

		relationship.reevaluateSocialRules();
	}

	toString(): string {
		return this.uid;
	}
}
