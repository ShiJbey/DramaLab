import { SocialEngine } from '@dramalab/tdrs-js';

export class Entity {
	private _uuid: string;

	constructor(uuid: string) {
		this._uuid = uuid;
	}

	get uuid(): string {
		return this._uuid;
	}
}

export class Location {
	public name: string;
	public entities: Map<string, object>;

	constructor(name: string) {
		this.name = name;
		this.entities = new Map();
	}
}

export class Agent {
	public uid: string;
	public name: string;
	public simulation: Simulation;

	constructor(simulation: Simulation, uid: string, name: string) {
		this.uid = uid;
		this.simulation = simulation;
		this.name = name;
	}
}

export class Simulation {
	public readonly agents: Map<string, Agent>;
	public readonly socialEngine: SocialEngine;

	constructor() {
		this.agents = new Map();
		this.socialEngine = new SocialEngine();
	}

	public addAgent(agent: Agent): void {
		this.agents.set(agent.uid, agent);
	}

	public RemoveAgent(agentId: string): boolean {
		return this.agents.delete(agentId);
	}
}
