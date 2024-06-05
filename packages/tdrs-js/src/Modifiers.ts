import { DBQuery } from "@dramalab/repraxis-js";
import { EventEffectContext, IEffect } from "./Effect";
import { SocialEntity } from "./ISocialEntity";
import { Relationship } from "./Relationship";

/** A modifier associated applied by a Trait or an Effect. */
export interface IModifier {
	/** Is the modifier still valid. */
	hasExpired(entity: SocialEntity): boolean;
	/** Apply the effects of the modifier to the entity. */
	apply(entity: SocialEntity): void;
	/** Remove the effects of the modifier from the entity. */
	remove(entity: SocialEntity): void;
	/** Called every time step that the modifier is attached and not expired. */
	update(entity: SocialEntity): void;
	/** Get a description of what the modifier does. */
	get description(): string;
	/** Get the source of the modifier. */
	get source(): object | null;
	/** Set the source of the modifier. */
	set source(value: object | null);
}

export abstract class Modifier implements IModifier {

	protected _source: object | null;

	constructor(source: object | null = null) {
		this._source = source;
	}

	abstract hasExpired(entity: SocialEntity): boolean;
	abstract apply(entity: SocialEntity): void;
	abstract remove(entity: SocialEntity): void;
	abstract update(entity: SocialEntity): void;
	abstract get description(): string;
	get source(): object | null { return this._source; }
	set source(value: object | null) { this._source = value; }
}

export class RelationshipModifier extends Modifier {

	protected readonly _description: string;
	public readonly direction: "incoming" | "outgoing";
	public readonly preconditions: string[];
	public readonly effects: IEffect[];
	public readonly hasDuration: boolean;
	protected _duration: number;

	constructor(
		description: string,
		preconditions: string[],
		direction: "incoming" | "outgoing",
		effects: IEffect[],
		duration = -1,
		source: object | null = null,
	) {
		super(source);
		this._description = description;
		this.preconditions = preconditions;
		this.direction = direction;
		this.effects = effects;
		this.hasDuration = duration > 0;
		this._duration = duration;
	}

	checkPreconditions(relationship: Relationship): boolean {
		const results = new DBQuery(this.preconditions).run(
			relationship.engine.db,
			{
				"?owner": relationship.owner.uid,
				"?target": relationship.target.uid
			},
		);

		return results.success;
	}

	hasExpired(entity: SocialEntity): boolean {
		const relationship = entity as Relationship;

		if (this.hasDuration && this._duration <= 0) return true;

		const results = new DBQuery(this.preconditions).run(
			relationship.engine.db,
			{
				"?owner": relationship.owner.uid,
				"?target": relationship.target.uid
			},
		);

		return results.success;
	}

	apply(entity: SocialEntity): void {
		return
	}

	remove(entity: SocialEntity): void {
		return
	}

	update(entity: SocialEntity): void {
		if (this.hasDuration) {
			this._duration -= 1;
		}
	}

	get description(): string {
		return this._description;
	}
}

/** Tracks a collection of active modifiers. */
export class ModifierCollection {
	public readonly owner: SocialEntity;
	public readonly modifiers: IModifier[];

	constructor(owner: SocialEntity) {
		this.owner = owner;
		this.modifiers = [];
	}

	add(modifier: IModifier): void {
		this.modifiers.push(modifier);
		modifier.apply(this.owner)
	}

	has(modifier: IModifier): boolean {
		return this.modifiers.includes(modifier);
	}

	remove(modifier: IModifier): IModifier | undefined {
		const itemsRemoved = this.modifiers.splice(
			this.modifiers.indexOf(modifier), 1
		);

		if (itemsRemoved.length > 0) {
			itemsRemoved[0].remove(this.owner);
		}

		return (itemsRemoved.length > 0) ? itemsRemoved[0] : undefined;
	}

	removeAllFromSource(source: object): IModifier[] {
		const itemsRemoved: IModifier[] = [];

		for (let i = this.modifiers.length - 1; i >= 0; i--) {
			const modifier = this.modifiers[i];
			if (modifier.source === source) {
				this.modifiers.splice(i, 1);
				itemsRemoved.push(modifier);
				modifier.remove(this.owner);
			}
		}

		return itemsRemoved;
	}
}

/** A class that creates modifier instances */
export abstract class ModifierFactory {

	public readonly modifierName: string;

	constructor(modifierName: string) {
		this.modifierName = modifierName;
	}

	/** Create a new modifier instance from the raw data. */
	abstract createInstance(ctx: EventEffectContext, ...args: string[]): IModifier;
}
