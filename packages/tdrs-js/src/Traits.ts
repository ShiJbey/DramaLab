import { IEffect } from "./Effect";

export enum TraitType {
	Agent = 0,
	Relationship,
}

export class Trait {

	public readonly traitId: string;
	public readonly name: string;
	public readonly traitType: TraitType;
	public readonly description: string;
	public readonly effects: IEffect[];
	public readonly conflictingTraits: Set<string>;

	constructor(
		traitId: string,
		traitType: TraitType,
		name: string,
		description: string,
		effects: IEffect[],
		conflictingTraits: string[],
	) {
		this.traitId = traitId;
		this.traitType = traitType;
		this.name = name;
		this.description = description;
		this.effects = [...effects];
		this.conflictingTraits = new Set(conflictingTraits);
	}
}

export class TraitInstance {

	public readonly trait: Trait;
	public readonly description: string;
	public readonly hasDuration: boolean;
	private _duration: number;

	constructor(
		trait: Trait,
		description: string,
		duration: number,
	) {
		this.trait = trait;
		this.description = description;
		this._duration = duration;
		this.hasDuration = duration > 0
	}

	get duration(): number { return this._duration; }

	tick(): void {
		if (this.hasDuration) {
			this._duration -= 1;
		}
	}
}

export class TraitManager {

	private readonly _traits: Map<string, TraitInstance>;

	constructor() {
		this._traits = new Map();
	}

	get traits(): TraitInstance[] { return [...this._traits.values()]; }

	hasTrait(traitId: string): boolean {
		return this._traits.has(traitId);
	}

	getTrait(traitId: string): TraitInstance {
		const traitInstance = this._traits.get(traitId);

		if (traitInstance === undefined) {
			throw new Error(`Could not find trait instance for '${traitId}'`);
		}

		return traitInstance;
	}

	canAddTrait(trait: Trait): boolean {
		if (this._traits.has(trait.traitId)) return false;

		if (this.hasConflictingTrait(trait)) return false;

		return true;
	}

	addTrait(trait: Trait, description = "", duration = -1): void {
		const traitInstance = new TraitInstance(
			trait,
			(description !== "") ? description : trait.description,
			duration
		)

		this._traits.set(trait.traitId, traitInstance);
	}

	removeTrait(traitId: string): Trait | undefined {
		const traitInstance = this._traits.get(traitId);

		if (traitInstance === undefined) return undefined;

		this._traits.delete(traitId);

		return traitInstance.trait;
	}

	hasConflictingTrait(trait: Trait): boolean {
		for (const existingTrait of this._traits.values()) {
			if (trait.conflictingTraits.has(existingTrait.trait.traitId)) return true;

			if (existingTrait.trait.conflictingTraits.has(trait.traitId)) return true;
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

		if (trait === undefined) {
			throw new Error(`Trait not found for ${traitId}`);
		}

		return trait;
	}
}
