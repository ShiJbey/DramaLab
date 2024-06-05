import { SocialEntity } from "./ISocialEntity";
import { SocialEngine } from "./SocialEngine";

export class EventEffectContext {

	public descriptionTemplate: string;
	public readonly bindings: Map<string, unknown>;
	public readonly engine: SocialEngine;

	constructor(
		engine: SocialEngine,
		descriptionTemplate: string,
		bindings: Map<string, unknown>
	) {
		this.engine = engine;
		this.descriptionTemplate = descriptionTemplate;
		this.bindings = new Map(bindings);
	}

	get description(): string {
		let description = this.descriptionTemplate;

		for (const [key, value] of this.bindings) {
			description = description.replace(
				`[${key.substring(1)}]`, String(value));
		}

		return description;
	}

	withBindings(bindings: Map<string, unknown>): EventEffectContext {
		const updatedBindings = new Map(this.bindings);

		for (const [key, value] of Object.entries(bindings)) {
			updatedBindings.set(key, value);
		}

		const updatedContext = new EventEffectContext(
			this.engine,
			this.descriptionTemplate,
			updatedBindings
		)

		return updatedContext;
	}
}

export class EventEffectLibrary {

	private _factories: Map<string, IEventEffectFactory>;

	constructor() {
		this._factories = new Map();
	}

	addEffectFactory(factory: IEventEffectFactory): void {
		this._factories.set(factory.effectName, factory);
	}

	getEffectFactory(effectName: string): IEventEffectFactory {
		const factory = this._factories.get(effectName);

		if (factory === undefined) throw new Error(`Cannot find effect factory for: ${effectName}`);

		return factory;
	}

	createInstance(ctx: EventEffectContext, effectString: string) {
		const effectParts = effectString.split(" ").map(s => s.trim());

		const effectName = effectParts[0];
		effectParts.splice(0, 1);

		const factory = this.getEffectFactory(effectName);

		const effect = factory.createInstance(ctx, effectParts)

		return effect;
	}
}

export interface IEventEffect {
	apply(): void;
}

export interface IEventEffectFactory {
	get effectName(): string;

	createInstance(ctx: EventEffectContext, args: string[]): IEventEffect;
}

/** An effect applied directly to an entity */
export interface IEffect {
	/** Apply the effect's changes. */
	apply(entity: SocialEntity): void;
	/** Undo the effect's changes. */
	remove(entity: SocialEntity): void;
}

/** Creates instances of effects. */
export interface IEffectFactory {
	/** Get the name of the effect this factory creates. */
	get effectName(): string;
	/** Create an instance of an effect. */
	createInstance(...args: string[]): IEffect;
}

export class EffectLibrary {

	private readonly _effectFactories: Map<string, IEffectFactory>;

	constructor() {
		this._effectFactories = new Map();
	}

	addEffectFactory(factory: IEffectFactory): void {
		this._effectFactories.set(factory.effectName, factory);
	}

	getEffectFactory(effectName: string): IEffectFactory {
		const factory = this._effectFactories.get(effectName);

		if (factory === undefined) {
			throw new Error(`No trait effect factory found for: ${effectName}`);
		}

		return factory;
	}
}
