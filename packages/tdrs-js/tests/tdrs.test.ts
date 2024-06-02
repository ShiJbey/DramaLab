import { describe, expect, test } from "@jest/globals";
import { SocialEngine } from "../src/SocialEngine";
import { Trait, TraitType } from "../src/Traits";
import { Stat, StatModifier, StatModifierData, StatModifierType, StatSchema } from "../src/Stats";
import { AgentSchema } from "../src/Agent";
import { RelationshipSchema } from "../src/Relationship";
import { SocialEvent, SocialEventResponse } from "../src/SocialEvent";
import { AddAgentTraitFactory } from "../src/Defaults/Effects";
import { SocialRule } from "../src/SocialRule";

let _engine: SocialEngine = new SocialEngine();
const assertTolerance = 0.0001;

beforeEach(() => {
	_engine = new SocialEngine();

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

	_engine.traitLibrary.addTrait(
		new Trait(
			"dating",
			TraitType.Relationship,
			"Dating",
			"[owner] is dating [target].",
			[],
			[]
		)
	);

	_engine.traitLibrary.addTrait(
		new Trait(
			"strangers",
			TraitType.Relationship,
			"Strangers",
			"[owner] does not know [target].",
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

	_engine.socialEventLibrary.addSocialEvent(
		new SocialEvent(
			"compliment",
			["?initiator", "?target"],
			"[initiator] complimented [target]",
			[
				new SocialEventResponse(
					[],
					[
						"AddAgentTrait ?target recently-complimented 3"
					],
					""
				),
			]
		)
	);

	_engine.addSocialRule(
		new SocialRule(
			"Characters like attractive characters",
			[
				"?other.traits.attractive"
			],
			[
				new StatModifierData(
					"Romance",
					12,
					StatModifierType.FLAT
				)
			]
		)
	);

	_engine.addSocialRule(
		new SocialRule(
			"Friendly characters are more friendly",
			[
				"?owner.traits.friendly",
			],
			[
				new StatModifierData(
					"Friendship",
					10,
					StatModifierType.FLAT
				)
			]
		)
	);

	_engine.effectLibrary.addEffectFactory(new AddAgentTraitFactory());
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

describe("Test Relationship", () => {

	test("Set Relationship Type", () => {
		const lisa = _engine.addAgent("character", "lisa");
		const sara = _engine.addAgent("character", "sara");

		const lisaToSara = _engine.addRelationship(
			lisa.uid, sara.uid
		);

		expect(lisaToSara.relationshipType).toBeNull();
		expect(_engine.db.assert("lisa.relationships.sara.type")).toBeFalsy();

		lisaToSara.setRelationshipType("strangers");
		expect(lisaToSara.relationshipType?.traitId).toBe("strangers");
		expect(_engine.db.assert("lisa.relationships.sara.type!strangers")).toBeTruthy();

		lisaToSara.setRelationshipType("dating");
		expect(lisaToSara.relationshipType?.traitId).toBe("dating");
		expect(_engine.db.assert("lisa.relationships.sara.type!dating")).toBeTruthy();
	});

});

describe("Test Social Engine", () => {

	test('TestAddAgent', () => {
		const agent = _engine.addAgent("character", "jose");

		expect(agent).not.toBeNull();

		expect(() => {
			_engine.addAgent("agent", "lisa");
		}).toThrow(Error);
	});

	test('TestAddRelationship', () => {
		const jose = _engine.addAgent("character", "jose");
		const lisa = _engine.addAgent("character", "lisa");
		const jose_to_lisa = _engine.addRelationship(jose.uid, lisa.uid);
		expect(jose_to_lisa).not.toBeNull();
		const lisa_to_jose = _engine.addRelationship(lisa.uid, jose.uid);
		expect(lisa_to_jose).not.toBeNull();
	});

	test('TestGetAgent', () => {
		_engine.addAgent("character", "jose");

		const jose = _engine.getAgent("jose");

		expect(jose).toBeDefined();

		expect(() => {
			_engine.getAgent("lisa");
		}).toThrow(Error);
	});

	test('TestGetRelationship', () => {
		const jose = _engine.addAgent("character", "jose");
		const lisa = _engine.addAgent("character", "lisa");

		expect(() => {
			_engine.getRelationship(jose.uid, lisa.uid);
		}).toThrow(Error);

		_engine.addRelationship(jose.uid, lisa.uid);

		expect(_engine.getRelationship(jose.uid, lisa.uid)).not.toBeNull();
	});

	test('TestRemoveAgent', () => {
		_engine.addAgent("character", "jose");
		_engine.addAgent("character", "lisa");
		_engine.addAgent("character", "sara");

		_engine.addRelationship("jose", "lisa");
		_engine.addRelationship("jose", "sara");

		_engine.addRelationship("sara", "jose");
		_engine.addRelationship("sara", "lisa");

		_engine.addRelationship("lisa", "jose");
		_engine.addRelationship("lisa", "sara");

		_engine.removeAgent("jose");

		expect(_engine.hasAgent("jose")).toBe(false);
		expect(_engine.hasRelationship("jose", "lisa")).toBe(false);
		expect(_engine.hasRelationship("jose", "sara")).toBe(false);
		expect(_engine.hasRelationship("lisa", "jose")).toBe(false);
		expect(_engine.hasRelationship("sara", "jose")).toBe(false);
	});

	test('TestRemoveRelationship', () => {
		_engine.addAgent("character", "jose");
		_engine.addAgent("character", "lisa");
		_engine.addAgent("character", "sara");

		_engine.addRelationship("jose", "lisa");
		_engine.addRelationship("jose", "sara");

		_engine.addRelationship("sara", "jose");
		_engine.addRelationship("sara", "lisa");

		_engine.addRelationship("lisa", "jose");
		_engine.addRelationship("lisa", "sara");

		_engine.removeRelationship("sara", "lisa");

		expect(_engine.hasRelationship("sara", "lisa")).toBe(false);
		expect(_engine.hasRelationship("lisa", "sara")).toBe(true);
	});

	test('TestDispatchEvent', () => {
		const jose = _engine.addAgent("character", "jose");
		const lisa = _engine.addAgent("character", "lisa");

		expect(lisa.traits.hasTrait("recently-complimented")).toBe(false);

		_engine.dispatchEvent("compliment", [jose.uid, lisa.uid]);

		expect(lisa.traits.hasTrait("recently-complimented")).toBe(true);

		_engine.tick();
		_engine.tick();
		_engine.tick();
		_engine.tick();

		expect(lisa.traits.hasTrait("recently-complimented")).toBe(false);
	});

	test('TestReset', () => {
		_engine.addAgent("character", "jose");
		_engine.addAgent("character", "lisa");
		_engine.addAgent("character", "sara");

		_engine.addRelationship("jose", "lisa");
		_engine.addRelationship("jose", "sara");

		_engine.addRelationship("sara", "jose");
		_engine.addRelationship("sara", "lisa");

		_engine.addRelationship("lisa", "jose");
		_engine.addRelationship("lisa", "sara");

		_engine.reset();

		expect(_engine.hasAgent("jose")).toBe(false);
		expect(_engine.hasAgent("lisa")).toBe(false);
		expect(_engine.hasAgent("sara")).toBe(false);
	});

});

describe("Test Social Rules", () => {

	test('TestOutgoingSocialRule', () => {
		const liza = _engine.addAgent("character", "liza");
		const zim = _engine.addAgent("character", "zim");

		const liza_to_zim = _engine.addRelationship(liza.uid, zim.uid);

		expect(liza_to_zim.stats.getStat("Friendship").value).toBeCloseTo(0, assertTolerance);

		liza.addTrait("friendly");

		expect(liza_to_zim.stats.getStat("Friendship").value).toBeCloseTo(10, assertTolerance);

		liza.removeTrait("friendly");

		expect(liza_to_zim.stats.getStat("Friendship").value).toBeCloseTo(0, assertTolerance);
	});

	test('TestIncomingSocialRule', () => {
		const liza = _engine.addAgent("character", "liza");
		const zim = _engine.addAgent("character", "zim");

		const liza_to_zim = _engine.addRelationship(liza.uid, zim.uid);

		expect(liza_to_zim.stats.getStat("Romance").value).toBeCloseTo(0, assertTolerance);

		zim.addTrait("attractive");

		expect(liza_to_zim.stats.getStat("Romance").value).toBeCloseTo(12, assertTolerance);

		zim.removeTrait("attractive");

		expect(liza_to_zim.stats.getStat("Romance").value).toBeCloseTo(0, assertTolerance);
	});




});

describe("Test Stat", () => {

	class MockStatObserver {
		private _value = 0;

		get value(): number {
			return this._value;
		}

		observeStat(stat: Stat): void {
			this._value = stat.value;
			stat.onValueChanged.subscribe((value) => {
				this._value = value.value;
			});
		}
	}

	class MockStatModifierSource { }

	// Constants
	const assertTolerance = 0.0001;

	test('Test Discrete value', () => {
		// Continuously-valued strength stat
		const strengthCont = new Stat(45.5, 0, 100, false);
		expect(strengthCont.value).toBeCloseTo(45.5, assertTolerance);

		// Discretely-valued strength stat
		const strengthDisc = new Stat(45.5, 0, 100, true);
		expect(strengthDisc.value).toBe(45);
	});

	test('Test value Clamped', () => {
		// Ensure the value of a stat is always clamped by the min and max values
		const insecurity = new Stat(123, 0, 50, true);
		expect(insecurity.value).toBe(50);

		const malice = new Stat(-54, -50, 50, true);
		expect(malice.value).toBe(-50);
	});

	test('Test BaseValue Changes value', () => {
		// Ensure changing the BaseValue property updates the value and triggers an OnValueChange event
		const compassion = new Stat(0, 0, 100, true);
		expect(compassion.value).toBe(0);

		compassion.baseValue = 30;
		expect(compassion.value).toBe(30);

		const observer = new MockStatObserver();
		observer.observeStat(compassion);
		expect(observer.value).toBe(30);

		compassion.baseValue = 63;
		expect(compassion.value).toBe(63);
		expect(observer.value).toBe(63);
	});

	test('Test Normalized value', () => {
		// Ensure the Normalized value properly normalizes a stat on the interval from 0.0 to 1.0
		const compassion = new Stat(0, 0, 100, true);
		expect(compassion.normalized).toBeCloseTo(0, assertTolerance);

		compassion.baseValue = 30;
		expect(compassion.normalized).toBeCloseTo(0.3, assertTolerance);

		compassion.baseValue = 63;
		expect(compassion.normalized).toBeCloseTo(0.63, assertTolerance);

		const malice = new Stat(-54, -50, 50, true);
		expect(malice.normalized).toBeCloseTo(0, assertTolerance);

		malice.baseValue = 0;
		expect(malice.normalized).toBeCloseTo(0.5, assertTolerance);
	});

	test('TestAddModifierFlat', () => {
		// Ensure adding FLAT modifiers correctly changes the stat value
		const mana = new Stat(25, 0, 100, false);

		const observer = new MockStatObserver();
		observer.observeStat(mana);

		const deBuff = new StatModifier("mana", -15, StatModifierType.FLAT, null);
		mana.addModifier(deBuff);
		expect(mana.value).toBeCloseTo(10, assertTolerance);

		const buff = new StatModifier("mana", 50, StatModifierType.FLAT, null);
		mana.addModifier(buff);
		expect(mana.value).toBeCloseTo(60, assertTolerance);

		expect(observer.value).toBeCloseTo(60, assertTolerance);
	});

	test('TestAddModifierPercentAdd', () => {
		// Ensure adding a PERCENT_ADD modifier correctly changes the stat value
		const mana = new Stat(25, 0, 100, false);

		const observer = new MockStatObserver();
		observer.observeStat(mana);

		const deBuff = new StatModifier("mana", -0.15, StatModifierType.PERCENT_ADD, null);
		mana.addModifier(deBuff);
		expect(mana.value).toBeCloseTo(21.25, assertTolerance);

		const buff = new StatModifier("mana", 0.50, StatModifierType.PERCENT_ADD, null);
		mana.addModifier(buff);
		expect(mana.value).toBeCloseTo(33.75, assertTolerance);

		expect(observer.value).toBeCloseTo(33.75, assertTolerance);
	});

	test('TestAddModifierPercentMultiply', () => {
		// Ensure adding a PERCENT_MULTIPLY modifier correctly changes the stat value
		const mana = new Stat(25, 0, 100, false);

		const observer = new MockStatObserver();
		observer.observeStat(mana);

		const deBuff = new StatModifier("mana", -0.15, StatModifierType.PERCENT_MULTIPLY, null);
		mana.addModifier(deBuff);
		expect(mana.value).toBeCloseTo(21.25, assertTolerance);

		const buff = new StatModifier("mana", 0.50, StatModifierType.PERCENT_MULTIPLY, null);
		mana.addModifier(buff);
		expect(mana.value).toBeCloseTo(31.875, assertTolerance);

		expect(observer.value).toBeCloseTo(31.875, assertTolerance);
	});


	test('TestRemoveModifiersFromSource', () => {
		const mana = new Stat(25, 0, 100, false);

		const observer = new MockStatObserver();
		observer.observeStat(mana);

		const sourceA = new MockStatModifierSource();
		const sourceB = new MockStatModifierSource();

		mana.addModifier(new StatModifier("mana", -5, StatModifierType.FLAT, sourceA));
		mana.addModifier(new StatModifier("mana", -10, StatModifierType.FLAT, sourceB));
		mana.addModifier(new StatModifier("mana", 25, StatModifierType.FLAT, sourceA));
		mana.addModifier(new StatModifier("mana", 15, StatModifierType.FLAT));
		mana.addModifier(new StatModifier("mana", 10, StatModifierType.FLAT, sourceB));

		expect(mana.value).toBe(60);

		mana.removeModifiersFromSource(sourceB);

		expect(mana.value).toBe(60);

		mana.removeModifiersFromSource(sourceA);

		expect(mana.value).toBe(40);

		expect(observer.value).toBeCloseTo(40, assertTolerance);
	});

	test('TestRemoveModifierReturnValue', () => {
		const mana = new Stat(25, 0, 100, false);

		const deBuff = new StatModifier("mana", -0.15, StatModifierType.PERCENT_MULTIPLY, null);
		const buff = new StatModifier("mana", 0.50, StatModifierType.PERCENT_MULTIPLY, null);

		mana.addModifier(deBuff);

		let success;

		success = mana.removeModifier(deBuff);
		expect(success).toBe(true);

		success = mana.removeModifier(buff);
		expect(success).toBe(false);
	});

	test('TestRemoveModifiersFromSourceReturnValue', () => {
		const mana = new Stat(25, 0, 100, false);

		const observer = new MockStatObserver();
		observer.observeStat(mana);

		const sourceA = new MockStatModifierSource();
		const sourceB = new MockStatModifierSource();
		const sourceC = new MockStatModifierSource();

		mana.addModifier(new StatModifier("mana", -5, StatModifierType.FLAT, sourceA));
		mana.addModifier(new StatModifier("mana", -10, StatModifierType.FLAT, sourceB));
		mana.addModifier(new StatModifier("mana", 25, StatModifierType.FLAT, sourceA));
		mana.addModifier(new StatModifier("mana", 15, StatModifierType.FLAT, null));
		mana.addModifier(new StatModifier("mana", 10, StatModifierType.FLAT, sourceB));

		let success;

		success = mana.removeModifiersFromSource(sourceA);
		expect(success).toBe(true);

		success = mana.removeModifiersFromSource(sourceC);
		expect(success).toBe(false);
	});


});
