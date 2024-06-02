import { SocialEngine } from "./SocialEngine";

export class EffectContext {

	private _descriptionTemplate: string;
	private _bindings: Map<string, unknown>;
	private _engine: SocialEngine;

	constructor(engine: SocialEngine, descriptionTemplate: string, bindings: Map<string, unknown>) {
		this._engine = engine;
		this._descriptionTemplate = descriptionTemplate;
		this._bindings = new Map(bindings);
	}

	get engine(): SocialEngine {
		return this._engine;
	}

	get bindings(): Map<string, unknown> {
		return this._bindings;
	}

	get descriptionTemplate(): string {
		return this._descriptionTemplate;
	}

	set descriptionTemplate(value: string) {
		this.descriptionTemplate = value;
	}

	get description(): string {
		let description = this._descriptionTemplate;

		for (const [key, value] of this._bindings) {
			description = description.replace(
				`[${key.substring(1)}]`, String(value));
		}

		return description;
	}

	withBindings(bindings: Map<string, unknown>): EffectContext {
		const updatedBindings = new Map(this.bindings);

		for (const [key, value] of Object.entries(bindings)) {
			updatedBindings.set(key, value);
		}

		const updatedContext = new EffectContext(
			this.engine,
			this.descriptionTemplate,
			updatedBindings
		)

		return updatedContext;
	}
}

export class EffectLibrary {

	private _factories: Map<string, IEffectFactory>;

	constructor() {
		this._factories = new Map();
	}

	addEffectFactory(factory: IEffectFactory): void {
		this._factories.set(factory.effectName, factory);
	}

	getEffectFactory(effectName: string): IEffectFactory {
		const factory = this._factories.get(effectName);

		if (factory === undefined) throw new Error(`Cannot find effect factory for: ${effectName}`);

		return factory;
	}

	createInstance(ctx: EffectContext, effectString: string) {
		const effectParts = effectString.split(" ").map(s => s.trim());

		const effectName = effectParts[0];
		effectParts.splice(0, 1);

		const factory = this.getEffectFactory(effectName);

		const effect = factory.createInstance(ctx, effectParts)

		return effect;
	}
}

export interface IEffect {
	apply(): void;
}

export interface IEffectFactory {
	get effectName(): string;

	createInstance(ctx: EffectContext, args: string[]): IEffect;
}
