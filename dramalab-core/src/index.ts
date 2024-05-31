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
	public agents: Map<string, Agent>;
	private _numAgents: number;

	constructor() {
		this.agents = new Map();
		this._numAgents = 0;
	}

	get NumAgents(): number {
		return this._numAgents;
	}

	public AddAgent(agent: Agent): void {
		this.agents.push(agent);
	}

	public RemoveAgent(agent: Agent): void {
		this.agents.remove;
	}
}
