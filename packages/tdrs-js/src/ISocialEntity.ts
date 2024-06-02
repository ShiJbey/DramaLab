import { SocialEngine } from "./SocialEngine";
import { StatManager } from "./Stats";
import { TraitManager } from "./Traits";

export interface ISocialEntity {
	get engine(): SocialEngine;
	get traits(): TraitManager;
	get stats(): StatManager;
}
