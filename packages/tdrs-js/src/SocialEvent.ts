export class SocialEventResponse {
	public readonly preconditions: string[];
	public readonly effects: string[];
	public readonly description: string;

	constructor(
		preconditions: string[],
		effects: string[],
		description: string,
	) {
		this.preconditions = preconditions;
		this.effects = effects;
		this.description = description;
	}
}

export class SocialEvent {

	public readonly name: string;
	public readonly roles: string[];
	public readonly description: string;
	public readonly responses: SocialEventResponse[];
	public readonly cardinality: number;
	public readonly symbol: string;

	constructor(
		name: string,
		roles: string[],
		description: string,
		responses: SocialEventResponse[]
	) {
		this.name = name;
		this.roles = roles;
		this.description = description;
		this.responses = responses;
		this.cardinality = roles.length;
		this.symbol = `${this.name}/${this.cardinality}`;
	}

	toString(): string { return this.symbol; }
}

export class SocialEventLibrary {
	private _events: Map<string, SocialEvent>;

	constructor() {
		this._events = new Map();
	}

	get events(): SocialEvent[] { return [...this._events.values()]; }

	addSocialEvent(socialEvent: SocialEvent): void {
		this._events.set(socialEvent.symbol, socialEvent);
	}

	getSocialEvent(symbol: string): SocialEvent {
		const socialEvent = this._events.get(symbol);

		if (socialEvent === undefined) {
			throw new Error(`No social event found for: ${symbol}`);
		}

		return socialEvent;
	}
}
