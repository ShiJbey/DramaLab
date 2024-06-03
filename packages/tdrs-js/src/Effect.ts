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

/** Effect applied and removed when a trait is applied to an entity. */
export interface ITraitEffect {
	/** Apply the effect's changes. */
	apply(entity: SocialEntity): void;
	/** Undo the effect's changes. */
	remove(entity: SocialEntity): void;
}
