import { Agent, AgentSchema } from "./Agent";
import { EffectLibrary, EventEffectContext, EventEffectLibrary } from "./Effect";
import { Relationship, RelationshipSchema } from "./Relationship";
import { SocialEventLibrary } from "./SocialEvent";
import { SocialRule, SocialRuleLibrary } from "./SocialRule";
import { Stat } from "./Stats";
import { TraitLibrary } from "./Traits";
import { RePraxisDatabase, DBQuery } from "@dramalab/repraxis-js";

export class SocialEngine {
	public readonly traitLibrary: TraitLibrary;
	public readonly socialRules: SocialRuleLibrary;
	public readonly socialEventLibrary: SocialEventLibrary;
	public readonly effectLibrary: EffectLibrary;
	public readonly eventEffectLibrary: EventEffectLibrary;
	public readonly db: RePraxisDatabase;
	public readonly agents: Map<string, Agent>;
	public readonly relationships: Map<string, Map<string, Relationship>>;
	public readonly agentSchemas: Map<string, AgentSchema>;
	public readonly relationshipSchemas: Map<string, Map<string, RelationshipSchema>>;

	constructor() {
		this.traitLibrary = new TraitLibrary();
		this.db = new RePraxisDatabase();
		this.socialRules = new SocialRuleLibrary();
		this.socialEventLibrary = new SocialEventLibrary();
		this.effectLibrary = new EffectLibrary();
		this.eventEffectLibrary = new EventEffectLibrary();
		this.agents = new Map();
		this.relationships = new Map();
		this.agentSchemas = new Map();
		this.relationshipSchemas = new Map();
	}

	addAgent(agentType: string, uid: string): Agent {

		const schema = this.getAgentSchema(agentType);

		const agent = new Agent(this, uid, agentType);
		this.agents.set(uid, agent);

		this.db.insert(`${uid}`);

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
		this.socialRules.addRule(socialRule);
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

		this.db.insert(`${owner.uid}.relationships.${target.uid}`);

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
		const agent = this.agents.get(agentId);

		if (agent === undefined) return false;

		this.agents.delete(agentId);

		// Need to cache the list first since we are removing while iterating
		const outgoingRelationships = [...agent.outgoingRelationships.values()];
		for (const relationship of outgoingRelationships) {
			this.removeRelationship(relationship.owner.uid, relationship.target.uid);
		}

		// Same things
		const incomingRelationships = [...agent.incomingRelationships.values()];
		for (const relationship of incomingRelationships) {
			this.removeRelationship(relationship.owner.uid, relationship.target.uid);
		}

		this.db.delete(`${agent.uid}`);

		this.relationships.delete(agent.uid);

		return true;
	}

	removeRelationship(ownerId: string, targetId: string): boolean {
		const relationshipMap = this.relationships.get(ownerId);

		if (relationshipMap === undefined) return false;

		const relationship = relationshipMap.get(targetId);

		if (relationship === undefined) return false;

		for (const trait of relationship.traits.traits) {
			relationship.removeTrait(trait.trait.traitId);
		}

		relationship.owner.outgoingRelationships.delete(relationship.target);
		relationship.target.incomingRelationships.delete(relationship.owner);

		relationshipMap.delete(targetId);

		this.db.delete(`${relationship.owner.uid}.relationships.${relationship.target.uid}`);

		return true;
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

		const bindings: Record<string, unknown> = {};
		for (let i = 0; i < eventType.roles.length; i++) {
			const role = eventType.roles[i];
			const agentID = agents[i];
			bindings[role] = agentID;
		}

		// Create the base context for the events
		const ctx = new EventEffectContext(
			this,
			eventType.description,
			new Map(Object.entries(bindings))
		);

		// Iterate through the responses
		for (const response of eventType.responses) {
			const results = new DBQuery(response.preconditions).run(this.db, bindings);

			// Skip this response because the query failed
			if (!results.success) continue;

			// Create a new context for each binding result
			for (const bindingSet of results.bindings) {
				const scopedCtx = ctx.withBindings(bindingSet);

				if (response.description !== "") {
					scopedCtx.descriptionTemplate = response.description;
				}

				try {
					const effects = response.effects.map((effectString: string) =>
						this.eventEffectLibrary.createInstance(scopedCtx, effectString)
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
