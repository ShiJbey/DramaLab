import { describe, expect, test, beforeAll } from "@jest/globals";
import { DBQuery, RePraxisDatabase } from "../src";

const _db = new RePraxisDatabase();


beforeAll(() => {

	_db.insert("astrid.relationships.jordan.reputation!30");
	_db.insert("astrid.relationships.jordan.tags.rivalry");
	_db.insert("astrid.relationships.britt.reputation!-10");
	_db.insert("astrid.relationships.britt.tags.ex_lover");
	_db.insert("astrid.relationships.lee.reputation!20");
	_db.insert("astrid.relationships.lee.tags.friend");
	_db.insert("britt.relationships.player.tags.spouse");
	_db.insert("player.relationships.jordan.reputation!-20");
	_db.insert("player.relationships.jordan.tags.enemy");
	_db.insert("player.relationships.britt.tags.spouse");

});

describe("RePraxis JS", () => {

	test("Test Insert Sentence", () => {
		const db = new RePraxisDatabase();

		// Create values
		db.insert("A.relationships.B.reputation!10");
		db.insert("A.relationships.B.type!rivalry");

		// Retrieve values
		expect(db.assert("A.relationships.B.reputation!19")).toBe(false);
		expect(db.assert("A.relationships.B.type")).toBe(true);
		expect(db.assert("A")).toBe(true);
	});

	test("Test Delete Sentence", () => {
		const db = new RePraxisDatabase();

		// Create values
		db.insert("A.relationships.B.reputation!10");

		// Delete a value
		db.delete("A.relationships.B.reputation");
		expect(db.assert("A.relationships.B.reputation")).toBe(false);
	});

	test("Test Update Sentence", () => {
		const db = new RePraxisDatabase();

		// Create values
		db.insert("A.relationships.B.reputation!10");

		// Update a value
		db.insert("A.relationships.B.reputation!-99");
		expect(db.assert("A.relationships.B.reputation!-99")).toBe(true);
		expect(db.assert("A.relationships.B.reputation.-99")).toBe(false);
	});

	test("Test Assert Expression With No Vars", () => {
		const query = new DBQuery()
			.where("astrid.relationships.britt");

		const result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(0);
	});

	test("Test Failing Assert Expression No Vars", () => {
		// Failing assertion without variables
		const query = new DBQuery()
			.where("astrid.relationships.haley");

		const result = query.run(_db);

		expect(result.success).toBe(false);
		expect(result.bindings.length).toBe(0);
	});

	test("Test GTE Expression", () => {
		const query = new DBQuery()
			.where("astrid.relationships.?other.reputation!?r")
			.where("gte ?r 10");

		const result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(2);
	});

	test("Test GTE Expression with Bindings", () => {
		const query = new DBQuery()
			.where("astrid.relationships.?other.reputation!?r")
			.where("gte ?r 10");

		const result = query.run(_db, { "?other": "lee" });

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(1);
	});

	test("Test LTE With Multiple Variables", () => {
		const query = new DBQuery()
			.where("?A.relationships.?other.reputation!?r")
			.where("lte ?r 0");

		const result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(2);
	});

	test("Test Not Expression", () => {
		const query = new DBQuery()
			.where("not player.relationships.jordan.reputation!30");

		const result = query.run(_db);

		expect(result.success).toBe(true);
	});

	test("Test Not Expression with Variables", () => {
		const query = new DBQuery()
			.where("not astrid.relationships.?other.reputation!15");

		const result = query.run(_db);

		expect(result.success).toBe(true);
	});

	test('Test Neq Expression With Vars', () => {
		// For all relationships astrid has with an ?other,
		// filter for those where reputation is not 30
		const query = new DBQuery()
			.where("astrid.relationships.?other.reputation!?rep")
			.where("neq ?rep 30");

		const result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(2); // britt and lee
	});

	test('Test Not Expression With Bindings', () => {
		// Given that ?other is jordan, is the statement still not true?
		const query = new DBQuery()
			.where("not player.relationships.?other.reputation!30");

		const result = query.run(_db, { "?other": "jordan" });

		expect(result.success).toBe(true);
	});

	test('Test Compound Not Queries', () => {
		let query;
		let result;

		// For all relationships astrid has with an ?other
		// filter for those where reputation is not 30
		query = new DBQuery()
			.where("astrid.relationships.?other")
			.where("not astrid.relationships.?other.reputation!30");

		result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(2); // britt and lee

		// For all relationships astrid has with an ?other
		// filter for those where reputation from astrid to ?other is not 30
		// and ?other does not have a relationship with a spouse tag
		query = new DBQuery()
			.where("astrid.relationships.?other")
			.where("not astrid.relationships.?other.reputation!30")
			.where("not ?other.relationships.?others_spouse.tags.spouse");

		result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(1); // lee

		// For all relationships astrid has with an ?other
		// filter for those where reputation from astrid to ?other is not 30.
		// Also ensure that the player does not have a spouse
		query = new DBQuery()
			.where("astrid.relationships.?other")
			.where("not astrid.relationships.?other.reputation!30")
			// below will fail because player has spouse
			.where("not player.relationships.?x.tags.spouse");

		result = query.run(_db);

		expect(result.success).toBe(false);

		// For all relationships astrid has with an ?other
		// filter for those where reputation from astrid to ?other is not 30.
		// Also ensure that the player does not have any friends
		query = new DBQuery()
			.where("astrid.relationships.?other")
			.where("not astrid.relationships.?other.reputation!30")
			.where("not player.relationships.?x.tags.friend");

		result = query.run(_db);

		expect(result.success).toBe(true);
	});

	test('Test Compound Query With Vars', () => {
		const query = new DBQuery()
			.where("?speaker.relationships.?other.reputation!?r0")
			.where("gt ?r0 10")
			.where("player.relationships.?other.reputation!?r1")
			.where("lt ?r1 0")
			.where("neq ?speaker player");

		const result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(1);
	});

	test('Test Results Data Types', () => {
		const query = new DBQuery()
			.where("?speaker.relationships.?other.reputation!?r0")
			.where("gt ?r0 10")
			.where("player.relationships.?other.reputation!?r1")
			.where("lt ?r1 0")
			.where("neq ?speaker player");

		const result = query.run(_db);

		expect(result.success).toBe(true);
		expect(result.bindings.length).toBe(1);
		expect(typeof result.bindings[0].get("?speaker")).toBe('string');
		expect(typeof result.bindings[0].get("?other")).toBe('string');
		expect(typeof result.bindings[0].get("?r0")).toBe('number');
		expect(typeof result.bindings[0].get("?r1")).toBe('number');
	});

	test('Test String Literal', () => {
		const db = new RePraxisDatabase();

		db.insert("toph.fullName!Toph Beifong");
		db.insert("toph.displayName!Toph: The greatest Earthbender in the world");

		expect(db.assert("toph.fullName!Toph Beifong")).toBe(true);

		const queryResult = new DBQuery()
			.where("toph.fullName!?fullName")
			.run(db);

		expect(queryResult.bindings[0].get("?fullName")).toBe("Toph Beifong");
	});

	test('Test Remove Nonexistent Data', () => {
		const db = new RePraxisDatabase();

		db.delete("katara");

		expect(true).toBe(true); // Ensure no error is thrown
	});

	test('Test Empty Query', () => {
		const db = new RePraxisDatabase();

		const queryResult = new DBQuery().run(db);

		expect(queryResult.success).toBe(true);
	});
});
