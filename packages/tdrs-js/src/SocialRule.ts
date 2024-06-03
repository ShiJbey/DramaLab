import { IModifier } from "./Modifiers";

export class SocialRule {
	public readonly description: string;
	public readonly preconditions: string[];
	public readonly modifiers: IModifier[];

	constructor(
		description: string,
		preconditions: string[],
		modifiers: IModifier[]
	) {
		this.description = description;
		this.preconditions = preconditions;
		this.modifiers = modifiers;
	}
}

