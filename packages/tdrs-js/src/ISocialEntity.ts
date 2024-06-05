import { Observable, Subject } from "rxjs";
import { ModifierCollection } from "./Modifiers";
import { SocialEngine } from "./SocialEngine";
import { StatManager } from "./Stats";
import { Trait, TraitManager } from "./Traits";

export type OnTraitAddedArgs = {
	trait: Trait;
};

export type OnTraitRemovedArgs = {
	trait: Trait;
};

export abstract class SocialEntity {

	public readonly uid: string;
	public readonly engine: SocialEngine;
	public readonly traits: TraitManager;
	public readonly stats: StatManager;
	public readonly modifiers: ModifierCollection;

	protected readonly _onTraitAdded: Subject<OnTraitAddedArgs>;
	protected readonly _onTraitRemoved: Subject<OnTraitRemovedArgs>;

	constructor(
		engine: SocialEngine,
		uid: string
	) {
		this.uid = uid;
		this.engine = engine;
		this.traits = new TraitManager();
		this.stats = new StatManager();
		this.modifiers = new ModifierCollection(this);
		this._onTraitAdded = new Subject();
		this._onTraitRemoved = new Subject();
	}

	abstract addTrait(
		traitId: string,
		duration: number,
		descriptionOverride: string
	): boolean;

	abstract removeTrait(traitId: string): boolean;

	get onTraitAdded(): Observable<OnTraitAddedArgs> {
		return this._onTraitAdded.asObservable();
	}

	get onTraitRemoved(): Observable<OnTraitRemovedArgs> {
		return this._onTraitRemoved.asObservable();
	}
}
