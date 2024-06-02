import { Relationship } from "./Relationship";
import { StatModifier, StatModifierData } from "./Stats";

export class SocialRule {
	public readonly description: string;
	public readonly preconditions: string[];
	public readonly modifiers: StatModifierData[];

	constructor(
		description: string,
		preconditions: string[],
		modifiers: StatModifierData[]
	) {
		this.description = description;
		this.preconditions = preconditions;
		this.modifiers = modifiers;
	}

	applyModifiers(relationship: Relationship): void {
		for (const modifier of this.modifiers) {
			relationship.stats.getStat(modifier.stat).addModifier(
				new StatModifier(
					modifier.stat,
					modifier.value,
					modifier.modifierType,
					this
				)
			)
		}
	}

	removeModifiers(relationship: Relationship): void {
		for (const modifier of this.modifiers) {
			relationship.stats.getStat(modifier.stat).removeModifiersFromSource(this);
		}
	}
}

