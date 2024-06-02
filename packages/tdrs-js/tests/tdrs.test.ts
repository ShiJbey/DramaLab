import { describe, expect, test, beforeAll } from "@jest/globals";
import { SocialEngine } from "../src/SocialEngine";
import { Trait, TraitType } from "../src/Traits";
import { StatModifierData, StatModifierType, StatSchema } from "../src/Stats";
import { AgentSchema } from "../src/Agent";
import { RelationshipSchema } from "../src/Relationship";

const _engine: SocialEngine = new SocialEngine();

beforeAll(() => {
	_engine.traitLibrary.addTrait(
		new Trait(
			"recently-complimented",
			TraitType.Agent,
			"Recently complimented",
			"[owner] recently received a compliment from someone.",
			[
				new StatModifierData(
					"Confidence",
					20,
					StatModifierType.FLAT
				)
			],
			[]
		)
	);

	_engine.traitLibrary.addTrait(
		new Trait(
			"confident",
			TraitType.Agent,
			"Confident",
			"[owner] is confident.",
			[
				new StatModifierData(
					"Confidence",
					10,
					StatModifierType.FLAT
				)
			],
			[]
		)
	);

	_engine.traitLibrary.addTrait(
		new Trait(
			"friendly",
			TraitType.Agent,
			"Friendly",
			"[owner] is friendly.",
			[],
			[]
		)
	);

	_engine.traitLibrary.addTrait(
		new Trait(
			"attractive",
			TraitType.Agent,
			"Attractive",
			"[owner] is attractive.",
			[],
			[]
		)
	);

	_engine.addAgentSchema(
		new AgentSchema(
			"character",
			[
				new StatSchema(
					"Confidence",
					0,
					0,
					50,
					true
				)
			],
			[]
		)
	);

	_engine.addRelationshipSchema(
		new RelationshipSchema(
			"character",
			"character",
			[
				new StatSchema(
					"Friendship",
					0,
					0,
					50,
					true
				),
				new StatSchema(
					"Romance",
					0,
					0,
					50,
					true
				)
			],
			[]
		)
	);
});

describe("Test Agent", () => {


	test("Add Trait", () => {
		const perry = _engine.addAgent("character", "perry");

		perry.addTrait("confident");

		expect(perry.stats.getStat("Confidence").value).toBe(10);
	});

	test("Add Trait With Duration", () => {
		const perry = _engine.addAgent("character", "perry");

		expect(perry.stats.getStat("Confidence").value).toBe(0);

		perry.addTrait("recently-complimented", 3);

		expect(perry.stats.getStat("Confidence").value).toBe(20);

		perry.tick();
		perry.tick();
		perry.tick();
		perry.tick();

		expect(perry.stats.getStat("Confidence").value).toBe(0);

	});

	test("Remove Trait", () => {
		const perry = _engine.addAgent("character", "perry");

		perry.addTrait("confident");

		expect(perry.stats.getStat("Confidence").value).toBe(10);

		perry.removeTrait("confident");

		expect(perry.stats.getStat("Confidence").value).toBe(0);
	});

});
