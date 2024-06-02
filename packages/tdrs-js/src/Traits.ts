import { Subject } from "rxjs";
import { ISocialEntity } from "./ISocialEntity";
import { StatModifier, StatModifierData } from "./Stats";

export enum TraitType {
	Agent = 0,
	Relationship,
}


export class Trait {

	private _traitId: string;
	private _name: string;
	private _traitType: TraitType;
	private _description: string;
	private _modifiers: StatModifierData[];
	private _conflictingTraits: Set<string>;

	constructor(
		traitId: string,
		traitType: TraitType,
		name: string,
		description: string,
		modifiers: StatModifierData[],
		conflictingTraits: string[],
	) {
		this._traitId = traitId;
		this._traitType = traitType;
		this._name = name;
		this._description = description;
		this._modifiers = [...modifiers];
		this._conflictingTraits = new Set(conflictingTraits);
	}

	get traitId(): string { return this._traitId; }
	get name(): string { return this._name; }
	get traitType(): TraitType { return this._traitType; }
	get description(): string { return this._description; }
	get modifiers(): StatModifierData[] { return this._modifiers; }
	get conflictingTraits(): Set<string> { return this._conflictingTraits; }

	ToString(): string { return this._name; }
}

export class TraitInstance {

	private _trait: Trait;
	private _target: ISocialEntity;
	private _description: string;
	private _hasDuration: boolean;
	private _duration: number;

	constructor(
		trait: Trait,
		target: ISocialEntity,
		description: string,
		duration: number,
	) {
		this._trait = trait;
		this._target = target;
		this._description = description;
		this._duration = duration;
		this._hasDuration = duration > 0
	}

	get trait(): Trait { return this._trait; }
	get traitId(): string { return this._trait.traitId; }
	get target(): ISocialEntity { return this._target; }
	get name(): string { return this._trait.name; }
	get traitType(): TraitType { return this._trait.traitType; }
	get description(): string { return this._description; }
	get modifiers(): StatModifierData[] { return this._trait.modifiers; }
	get conflictingTraits(): Set<string> { return this._trait.conflictingTraits; }
	get hasDuration(): boolean { return this._hasDuration; }
	get duration(): number { return this._duration; }

	tick(): void {
		if (this._hasDuration) {
			this._duration -= 1;
		}
	}

	applyModifiers(): void {
		for (const modifier of this._trait.modifiers) {
			this._target.stats.getStat(modifier.stat).addModifier(
				new StatModifier(modifier.stat, modifier.value, modifier.modifierType, this)
			);
		}
	}

	removeModifiers(): void {
		for (const modifier of this._trait.modifiers) {
			this._target.stats.getStat(modifier.stat).removeModifiersFromSource(this);
		}
	}
}

export type OnTraitAddedArgs = {
	trait: Trait;
};

export type OnTraitRemovedArgs = {
	trait: Trait;
};

export class TraitManager {

	private _target: ISocialEntity;
	private _traits: Map<string, TraitInstance>;

	public readonly onTraitAdded: Subject<OnTraitAddedArgs>;
	public readonly onTraitRemoved: Subject<OnTraitRemovedArgs>;

	constructor(
		target: ISocialEntity,
	) {
		this._target = target;
		this._traits = new Map();

		this.onTraitAdded = new Subject();
		this.onTraitRemoved = new Subject();
	}

	get traits(): TraitInstance[] { return [...this._traits.values()]; }


	hasTrait(traitId: string): boolean {
		return this._traits.has(traitId);
	}

	getTrait(traitId: string): TraitInstance {
		const traitInstance = this._traits.get(traitId);

		if (traitInstance === undefined) throw new Error(`Could not find trait instance for '${traitId}'`);

		return traitInstance;
	}

	addTrait(trait: Trait, description = "", duration = -1): boolean {
		if (this._traits.has(trait.traitId)) return false;

		if (this.hasConflictingTrait(trait)) return false;

		const traitInstance = new TraitInstance(
			trait,
			this._target,
			(description !== "") ? description : trait.description,
			duration
		)

		this._traits.set(trait.traitId, traitInstance);

		traitInstance.applyModifiers()

		this.onTraitAdded.next({ trait: trait })

		return true;
	}

	removeTrait(traitId: string): boolean {
		const traitInstance = this._traits.get(traitId);

		if (traitInstance === undefined) return false;

		this._traits.delete(traitId);

		traitInstance.removeModifiers();

		this.onTraitRemoved.next({ trait: traitInstance.trait });

		return true;
	}

	hasConflictingTrait(trait: Trait): boolean {
		for (const existingTrait of this._traits.values()) {
			if (trait.conflictingTraits.has(existingTrait.traitId)) return true;

			if (existingTrait.conflictingTraits.has(trait.traitId)) return true;
		}

		return false;
	}

}

export class TraitLibrary {

	private readonly _traits: Map<string, Trait>;

	constructor() {
		this._traits = new Map();
	}

	get traits(): Trait[] { return [...this._traits.values()]; }


	addTrait(trait: Trait): void {
		this._traits.set(trait.traitId, trait);
	}

	getTrait(traitId: string): Trait {
		const trait = this._traits.get(traitId);

		if (trait === undefined) throw new Error(`Trait not found for ${traitId}`);

		return trait;
	}
}
