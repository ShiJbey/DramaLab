import { Agent } from "../Agent";
import { EffectContext, IEffect, IEffectFactory } from "../Effect";
import { Relationship } from "../Relationship";
import { StatModifier, StatModifierType } from "../Stats";

export class AddAgentTrait implements IEffect {

	public readonly agent: Agent;
	public readonly traitId: string;
	public readonly duration: number;
	public readonly description: string;

	constructor(
		agent: Agent,
		traitId: string,
		duration: number,
		description: string,
	) {
		this.agent = agent;
		this.traitId = traitId;
		this.duration = duration;
		this.description = description;
	}

	apply(): void {
		this.agent.addTrait(this.traitId, this.duration, this.description);
	}
}

export class AddAgentTraitFactory implements IEffectFactory {

	get effectName(): string { return "AddAgentTrait"; }

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 2) {
			const argStr = args.join(" ");

			throw new Error(
				`Incorrect number of arguments for 'AddAgentTrait ${argStr}'. `
				+ `Expected at least 2 but was ${args.length}.`
			);
		}

		const agentVar = args[0];
		const traitID = args[1];
		let duration = -1;

		if (!ctx.engine.hasAgent(ctx.bindings.get(agentVar) as string)) {
			throw new Error(
				`No Agent found with ID: ${ctx.bindings.get(agentVar)}`
			);
		}

		if (args.length >= 3) {
			const parsedDuration = parseInt(args[2]);
			if (isNaN(parsedDuration)) {
				throw new Error(
					`Expected integer as 3rd argument but was '${args[2]}'`
				);
			}
			duration = parsedDuration;
		}


		return new AddAgentTrait(
			ctx.engine.getAgent(ctx.bindings.get(agentVar) as string),
			traitID,
			duration,
			ctx.description
		);
	}
}

export class AddRelationshipTrait implements IEffect {
	public readonly relationship: Relationship;
	public readonly traitId: string;
	public readonly duration: number;
	public readonly description: string;

	constructor(
		relationship: Relationship,
		traitId: string,
		duration: number,
		description: string,
	) {
		this.relationship = relationship;
		this.traitId = traitId;
		this.duration = duration;
		this.description = description;
	}

	apply(): void {
		this.relationship.addTrait(this.traitId, this.duration, this.description);
	}
}

export class AddRelationshipTraitFactory implements IEffectFactory {

	get effectName(): string {
		return "AddRelationshipTrait";
	}

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 3) {
			const argStr = args.join(" ");
			throw new Error(
				`Incorrect number of arguments for 'AddRelationshipTrait ${argStr}'. Expected at least 3 but was ${args.length}.`
			);
		}

		const relationshipOwnerVar = args[0];
		const relationshipTargetVar = args[1];
		const traitID = args[2];
		let duration = -1;

		if (!ctx.engine.hasRelationship(
			(ctx.bindings.get(relationshipOwnerVar) as string),
			(ctx.bindings.get(relationshipTargetVar) as string))
		) {
			throw new Error(
				`No relationship found from ${ctx.bindings.get(relationshipOwnerVar)} `
				+ `to ${ctx.bindings.get(relationshipTargetVar)}.`
			);
		}

		if (args.length >= 4) {
			const durationArg = args[3];
			const parsedDuration = parseInt(durationArg, 10);
			if (isNaN(parsedDuration)) {
				throw new Error(`Expected integer as 4th argument but was '${durationArg}'`);
			}
			duration = parsedDuration;
		}

		return new AddRelationshipTrait(
			ctx.engine.getRelationship(
				(ctx.bindings.get(relationshipOwnerVar) as string),
				(ctx.bindings.get(relationshipTargetVar) as string)
			),
			traitID,
			duration,
			ctx.description
		);
	}
}

export class AddAgentStatBuff implements IEffect {
	public readonly agent: Agent;
	public readonly statName: string;
	public readonly value: number;

	constructor(
		agent: Agent,
		statName: string,
		value: number,
	) {
		this.agent = agent;
		this.statName = statName;
		this.value = value
	}

	apply(): void {
		this.agent.stats.getStat(this.statName).addModifier(
			new StatModifier(
				this.statName,
				this.value,
				StatModifierType.FLAT,
				this
			)
		)
	}
}

export class AddAgentStatBuffFactory implements IEffectFactory {
	get effectName(): string {
		return "AddAgentStatBuff";
	}

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 3) {
			const argStr = args.join(" ");
			throw new Error(
				`Incorrect number of arguments for IncreaseAgentStat ${argStr}'. Expected 3 but was ${args.length}.`
			);
		}

		const agentVar = args[0];
		const statName = args[1];

		if (!ctx.engine.hasAgent(ctx.bindings.get(agentVar) as string)) {
			throw new Error(
				`No Agent found with ID: ${ctx.bindings.get(agentVar)}`
			);
		}

		const valueArg = args[2];
		const value = parseFloat(valueArg);
		if (isNaN(value)) {
			throw new Error(`Expected number as last argument but was '${valueArg}'`);
		}

		return new AddAgentStatBuff(
			ctx.engine.getAgent(ctx.bindings.get(agentVar) as string),
			statName,
			value
		);
	}
}

export class IncrementAgentBaseStat implements IEffect {
	public readonly agent: Agent;
	public readonly statName: string;
	public readonly value: number;

	constructor(
		agent: Agent,
		statName: string,
		value: number,
	) {
		this.agent = agent;
		this.statName = statName;
		this.value = value
	}

	apply(): void {
		this.agent.stats.getStat(this.statName).baseValue += this.value;
	}
}

export class IncrementAgentBaseStatFactory implements IEffectFactory {
	get effectName(): string {
		return "IncrementAgentBaseStat";
	}

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 3) {
			const argStr = args.join(" ");
			throw new Error(
				`Incorrect number of arguments for IncreaseAgentStat ${argStr}'. Expected 3 but was ${args.length}.`
			);
		}

		const agentVar = args[0];
		const statName = args[1];

		if (!ctx.engine.hasAgent(ctx.bindings.get(agentVar) as string)) {
			throw new Error(
				`No Agent found with ID: ${ctx.bindings.get(agentVar)}`
			);
		}

		const valueArg = args[2];
		const value = parseFloat(valueArg);
		if (isNaN(value)) {
			throw new Error(`Expected number as last argument but was '${valueArg}'`);
		}

		return new IncrementAgentBaseStat(
			ctx.engine.getAgent(ctx.bindings.get(agentVar) as string),
			statName,
			value
		);
	}
}

export class IncreaseRelationshipStat implements IEffect {
	public readonly relationship: Relationship;
	public readonly statName: string;
	public readonly value: number;

	constructor(
		relationship: Relationship,
		statName: string,
		value: number,
	) {
		this.relationship = relationship;
		this.statName = statName;
		this.value = value
	}

	apply(): void {
		this.relationship.stats.getStat(this.statName).baseValue += this.value;
	}
}

export class IncreaseRelationshipStatFactory implements IEffectFactory {
	get effectName(): string {
		return "IncreaseRelationshipStat";
	}

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 4) {
			const argStr = args.join(" ");
			throw new Error(
				`Incorrect number of arguments for 'IncreaseRelationshipStat ${argStr}'. Expected 4 but was ${args.length}.`
			);
		}

		const relationshipOwnerVar = args[0];
		const relationshipTargetVar = args[1];
		const statName = args[2];

		if (!ctx.engine.hasRelationship(
			ctx.bindings.get(relationshipOwnerVar) as string,
			ctx.bindings.get(relationshipTargetVar) as string
		)) {
			throw new Error(
				`No relationship found from ${ctx.bindings.get(relationshipOwnerVar)} to`
				+ ` ${ctx.bindings.get(relationshipTargetVar)}.`
			);
		}

		const valueArg = args[3];
		const value = parseFloat(valueArg);
		if (isNaN(value)) {
			throw new Error(`Expected number as last argument but was '${valueArg}'`);
		}

		return new IncreaseRelationshipStat(
			ctx.engine.getRelationship(
				ctx.bindings.get(relationshipOwnerVar) as string,
				ctx.bindings.get(relationshipTargetVar) as string
			),
			statName,
			value
		);
	}
}

export class AddRelationshipStatBuff implements IEffect {
	public readonly relationship: Relationship;
	public readonly statName: string;
	public readonly value: number;

	constructor(
		relationship: Relationship,
		statName: string,
		value: number,
	) {
		this.relationship = relationship;
		this.statName = statName;
		this.value = value
	}

	apply(): void {
		this.relationship.stats.getStat(this.statName).addModifier(
			new StatModifier(
				this.statName,
				this.value,
				StatModifierType.FLAT,
				this
			)
		)
	}
}

export class RemoveAgentTrait implements IEffect {
	public readonly agent: Agent;
	public readonly traitId: string;

	constructor(
		agent: Agent,
		traitId: string,
	) {
		this.agent = agent;
		this.traitId = traitId;
	}

	apply(): void {
		this.agent.removeTrait(this.traitId);
	}
}

export class RemoveAgentTraitFactory implements IEffectFactory {

	get effectName(): string { return "AddAgentTrait"; }

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 2) {
			const argStr = args.join(" ");

			throw new Error(
				`Incorrect number of arguments for 'RemoveAgentTrait ${argStr}'. `
				+ `Expected at least 2 but was ${args.length}.`
			);
		}

		const agentVar = args[0];
		const traitID = args[1];

		if (!ctx.engine.hasAgent(ctx.bindings.get(agentVar) as string)) {
			throw new Error(
				`No Agent found with ID: ${ctx.bindings.get(agentVar)}`
			);
		}

		return new RemoveAgentTrait(
			ctx.engine.getAgent(ctx.bindings.get(agentVar) as string),
			traitID,
		);
	}
}

export class RemoveRelationshipTrait implements IEffect {
	public readonly relationship: Relationship;
	public readonly traitId: string;

	constructor(
		relationship: Relationship,
		traitId: string,
	) {
		this.relationship = relationship;
		this.traitId = traitId;
	}

	apply(): void {
		this.relationship.removeTrait(this.traitId);
	}
}

export class RemoveRelationshipTraitFactory implements IEffectFactory {

	get effectName(): string {
		return "RemoveRelationshipTrait";
	}

	createInstance(ctx: EffectContext, args: string[]): IEffect {
		if (args.length < 3) {
			const argStr = args.join(" ");
			throw new Error(
				`Incorrect number of arguments for 'RemoveRelationshipTrait ${argStr}'. Expected at least 3 but was ${args.length}.`
			);
		}

		const relationshipOwnerVar = args[0];
		const relationshipTargetVar = args[1];
		const traitID = args[2];

		if (!ctx.engine.hasRelationship(
			(ctx.bindings.get(relationshipOwnerVar) as string),
			(ctx.bindings.get(relationshipTargetVar) as string))
		) {
			throw new Error(
				`No relationship found from ${ctx.bindings.get(relationshipOwnerVar)} `
				+ `to ${ctx.bindings.get(relationshipTargetVar)}.`
			);
		}

		return new RemoveRelationshipTrait(
			ctx.engine.getRelationship(
				(ctx.bindings.get(relationshipOwnerVar) as string),
				(ctx.bindings.get(relationshipTargetVar) as string)
			),
			traitID,
		);
	}
}
