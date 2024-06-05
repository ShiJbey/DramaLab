import { Agent } from "../Agent";
import { IEffect } from "../Effect";
import { SocialEntity } from "../ISocialEntity";
import { IModifier, RelationshipModifier } from "../Modifiers";
import { StatModifier, StatModifierType } from "../Stats";

export class AddStatModifier implements IEffect {

	public readonly statName: string;
	public readonly amount: number;
	public readonly modifierType: StatModifierType;
	public readonly duration: number;

	constructor(
		statName: string,
		amount: number,
		modifierType: StatModifierType,
		duration: number
	) {
		this.statName = statName;
		this.amount = amount;
		this.modifierType = modifierType;
		this.duration = duration;
	}

	apply(entity: SocialEntity): void {
		entity.modifiers.add(
			new StatModifier(
				this.statName,
				this.amount,
				this.modifierType,
				this.duration,
				this
			)
		)
	}
	remove(entity: SocialEntity): void {
		entity.modifiers.removeAllFromSource(this);
	}
}

export class AddRelationshipModifier implements IEffect {

	public readonly preconditions: string[];
	public readonly direction: "incoming" | "outgoing";
	public readonly modifiers: IModifier[];
	public readonly duration: number
	public readonly description: string;

	constructor(
		preconditions: string[],
		direction: "incoming" | "outgoing",
		modifiers: IModifier[],
		description: string,
		duration: number,
	) {
		this.preconditions = preconditions;
		this.direction = direction;
		this.modifiers = modifiers;
		this.description = description;
		this.duration = duration;
	}

	apply(entity: SocialEntity): void {
		if (entity instanceof Agent) {
			entity.relationshipModifiers.add(
				new RelationshipModifier(
					this.description,
					this.preconditions,
					this.direction,
					this.modifiers,
					this.duration,
					this
				)
			)
		}
	}

	remove(entity: SocialEntity): void {
		if (entity instanceof Agent) {
			entity.modifiers.removeAllFromSource(this);
		}
	}
}
