import { Agent, AgentSchema } from "./Agent";
import { EffectContext, EffectLibrary } from "./Effect";
import { Relationship, RelationshipSchema } from "./Relationship";
import { SocialEventLibrary } from "./SocialEvent";
import { SocialRule } from "./SocialRule";
import { Stat } from "./Stats";
import { TraitLibrary } from "./Traits";
import { RePraxisDatabase, DBQuery } from "@dramalab/repraxis-js";

export class SocialEngine {
	public readonly traitLibrary: TraitLibrary;
	public readonly socialRules: SocialRule[];
	public readonly effectLibrary: EffectLibrary;
	public readonly socialEventLibrary: SocialEventLibrary;
	public readonly db: RePraxisDatabase;
	public readonly agents: Map<string, Agent>;
	public readonly relationships: Map<string, Map<string, Relationship>>;
	public readonly agentSchemas: Map<string, AgentSchema>;
	public readonly relationshipSchemas: Map<string, Map<string, RelationshipSchema>>;

	constructor() {
		this.traitLibrary = new TraitLibrary();
		this.db = new RePraxisDatabase();
		this.socialRules = [];
		this.effectLibrary = new EffectLibrary();
		this.socialEventLibrary = new SocialEventLibrary();
		this.agents = new Map();
		this.relationships = new Map();
		this.agentSchemas = new Map();
		this.relationshipSchemas = new Map();
	}

	addAgent(agentType: string, uid: string): Agent {

		const schema = this.getAgentSchema(agentType);

		const agent = new Agent(this, uid, agentType);
		this.agents.set(uid, agent);

		this.db.Insert(`${uid}`);

		// Configure stats
		for (const entry of schema.stats) {
			agent.stats.addStat(
				entry.stat,
				new Stat(
					entry.baseValue, entry.minValue, entry.maxValue, entry.isDiscrete
				)
			);
		}

		// Configure initial traits
		for (const traitId in schema.traits) {
			agent.addTrait(traitId);
		}

		return agent;
	}

	addSocialRule(socialRule: SocialRule): void {
		this.socialRules.push(socialRule);
	}

	addRelationship(ownerId: string, targetId: string): Relationship {

		const owner = this.getAgent(ownerId);
		const target = this.getAgent(targetId);

		const schema = this.getRelationshipSchema(owner.agentType, target.agentType);

		const relationship = new Relationship(this, owner, target);

		if (!this.relationships.has(owner.uid)) {
			this.relationships.set(owner.uid, new Map());
		}

		const nestedMap = this.relationships.get(owner.uid);

		if (nestedMap === undefined) {
			throw new Error(`No relationship map found for owner: ${owner.uid}`);
		}

		nestedMap.set(target.uid, relationship);

		owner.outgoingRelationships.set(target, relationship);
		target.incomingRelationships.set(owner, relationship);

		this.db.Insert(`${owner.uid}.relationships.${target.uid}`);

		// Set initial stats from schema
		for (const entry of schema.stats) {
			relationship.stats.addStat(
				entry.stat,
				new Stat(
					entry.baseValue, entry.minValue, entry.maxValue, entry.isDiscrete
				)
			);
		}

		// Configure initial traits
		for (const traitId in schema.traits) {
			relationship.addTrait(traitId);
		}

		relationship.reevaluateSocialRules();

		return relationship;
	}

	addAgentSchema(schema: AgentSchema): void {
		this.agentSchemas.set(schema.agentType, schema);
	}

	getAgentSchema(agentType: string): AgentSchema {
		const schema = this.agentSchemas.get(agentType);

		if (schema === undefined) {
			throw new Error(`No schema found for agent type: ${agentType}`);
		}

		return schema;
	}

	getAgent(agentId: string): Agent {
		const agent = this.agents.get(agentId);

		if (agent === undefined) {
			throw new Error(`Agent not found with ID: ${agentId}`);
		}

		return agent;
	}

	getRelationship(ownerId: string, targetId: string): Relationship {
		const relationshipMap = this.relationships.get(ownerId);

		if (relationshipMap === undefined) {
			throw new Error(`No relationship map found for owner: ${ownerId}`);
		}

		const relationship = relationshipMap.get(targetId);

		if (relationship === undefined) {
			throw new Error(`No relationship found for target: ${targetId}`);
		}

		return relationship;
	}

	hasAgent(agentId: string): boolean {
		return this.agents.has(agentId);
	}

	hasRelationship(ownerId: string, targetId: string): boolean {
		const nestedMap = this.relationships.get(ownerId);

		if (nestedMap === undefined) return false;

		return nestedMap.has(targetId);
	}

	removeAgent(agentId: string): boolean {
		return this.agents.delete(agentId);
	}

	removeRelationship(ownerId: string, targetId: string): boolean {
		const nestedMap = this.relationships.get(ownerId);

		if (nestedMap === undefined) return false;

		return nestedMap.delete(targetId);
	}

	tick(): void {
		for (const agent of this.agents.values()) {
			agent.tick();
		}

		for (const relationship_map of this.relationships.values()) {
			for (const relationship of relationship_map.values()) {
				relationship.tick();
			}
		}
	}

	addRelationshipSchema(schema: RelationshipSchema): void {
		if (!this.relationshipSchemas.has(schema.ownerType)) {
			this.relationshipSchemas.set(schema.ownerType, new Map());
		}

		const nestedMap = this.relationshipSchemas.get(schema.ownerType);

		if (nestedMap === undefined) {
			throw new Error(`No schema found for owner type: ${schema.ownerType}`);
		}

		nestedMap.set(schema.targetType, schema);
	}

	getRelationshipSchema(ownerType: string, targetType: string): RelationshipSchema {
		const nestedMap = this.relationshipSchemas.get(ownerType);

		if (nestedMap === undefined) {
			throw new Error(`No schema found for owner type: ${ownerType}`);
		}

		const schema = nestedMap.get(targetType);

		if (schema === undefined) {
			throw new Error(`No schema found for target type: ${targetType}`);
		}

		return schema;
	}

	dispatchEvent(eventName: string, agents: string[]): void {
		// Get the event type definition from the library
		const eventType = this.socialEventLibrary.getSocialEvent(`${eventName}/${agents.length}`);

		const bindings: Record<string, object> = {};
		for (let i = 0; i < eventType.roles.length; i++) {
			const role = eventType.roles[i];
			const agentID = agents[i];
			bindings[role] = new String(agentID);
		}

		// Create the base context for the events
		const ctx = new EffectContext(
			this,
			eventType.description,
			new Map(Object.entries(bindings))
		);

		// Iterate through the responses
		for (const response of eventType.responses) {
			const results = new DBQuery(response.preconditions).Run(this.db, bindings);

			// Skip this response because the query failed
			if (!results.Success) continue;

			// Create a new context for each binding result
			for (const bindingSet of results.Bindings) {
				const scopedCtx = ctx.withBindings(bindingSet);

				if (response.description !== "") {
					scopedCtx.descriptionTemplate = response.description;
				}

				try {
					const effects = response.effects.map((effectString: string) =>
						this.effectLibrary.createInstance(scopedCtx, effectString)
					);

					for (const effect of effects) {
						effect.apply();
					}
				} catch (ex) {
					if (ex instanceof Error) {
						throw new Error(
							`Error encountered while instantiating effects for '${eventName}' event: ${ex.message}`
						);
					}
				}
			}
		}
	}

	reevaluateRelationships(): void {
		for (const agent of this.agents.values()) {
			agent.reevaluateRelationships();
		}
	}

	reset(): void {
		this.agents.clear();
		this.relationships.clear();
	}
}
