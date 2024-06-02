import { describe, expect, test, beforeAll } from "@jest/globals";
import { DBQuery, RePraxisDatabase } from "../src";

const _db = new RePraxisDatabase();


beforeAll(() => {

	_db.Insert("astrid.relationships.jordan.reputation!30");
	_db.Insert("astrid.relationships.jordan.tags.rivalry");
	_db.Insert("astrid.relationships.britt.reputation!-10");
	_db.Insert("astrid.relationships.britt.tags.ex_lover");
	_db.Insert("astrid.relationships.lee.reputation!20");
	_db.Insert("astrid.relationships.lee.tags.friend");
	_db.Insert("britt.relationships.player.tags.spouse");
	_db.Insert("player.relationships.jordan.reputation!-20");
	_db.Insert("player.relationships.jordan.tags.enemy");
	_db.Insert("player.relationships.britt.tags.spouse");

});

describe("RePraxis JS", () => {

	test("Test Insert Sentence", () => {
		const db = new RePraxisDatabase();

		// Create values
		db.Insert("A.relationships.B.reputation!10");
		db.Insert("A.relationships.B.type!rivalry");

		// Retrieve values
		expect(db.Assert("A.relationships.B.reputation!19")).toBe(false);
		expect(db.Assert("A.relationships.B.type")).toBe(true);
		expect(db.Assert("A")).toBe(true);
	});

	test("Test Delete Sentence", () => {
		const db = new RePraxisDatabase();

		// Create values
		db.Insert("A.relationships.B.reputation!10");

		// Delete a value
		db.Delete("A.relationships.B.reputation");
		expect(db.Assert("A.relationships.B.reputation")).toBe(false);
	});

	test("Test Update Sentence", () => {
		const db = new RePraxisDatabase();

		// Create values
		db.Insert("A.relationships.B.reputation!10");

		// Update a value
		db.Insert("A.relationships.B.reputation!-99");
		expect(db.Assert("A.relationships.B.reputation!-99")).toBe(true);
		expect(db.Assert("A.relationships.B.reputation.-99")).toBe(false);
	});

	test("Test Assert Expression With No Vars", () => {
		const query = new DBQuery()
			.Where("astrid.relationships.britt");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(0);
	});

	test("Test Failing Assert Expression No Vars", () => {
		// Failing assertion without variables
		const query = new DBQuery()
			.Where("astrid.relationships.haley");

		const result = query.Run(_db);

		expect(result.Success).toBe(false);
		expect(result.Bindings.length).toBe(0);
	});

	test("Test GTE Expression", () => {
		const query = new DBQuery()
			.Where("astrid.relationships.?other.reputation!?r")
			.Where("gte ?r 10");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(2);
	});

	test("Test GTE Expression with Bindings", () => {
		const query = new DBQuery()
			.Where("astrid.relationships.?other.reputation!?r")
			.Where("gte ?r 10");

		const result = query.Run(_db, { "?other": "lee" });

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(1);
	});

	test("Test LTE With Multiple Variables", () => {
		const query = new DBQuery()
			.Where("?A.relationships.?other.reputation!?r")
			.Where("lte ?r 0");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(2);
	});

	test("Test Not Expression", () => {
		const query = new DBQuery()
			.Where("not player.relationships.jordan.reputation!30");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
	});

	test("Test Not Expression with Variables", () => {
		const query = new DBQuery()
			.Where("not astrid.relationships.?other.reputation!15");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
	});

	test('Test Neq Expression With Vars', () => {
		// For all relationships astrid has with an ?other,
		// filter for those where reputation is not 30
		const query = new DBQuery()
			.Where("astrid.relationships.?other.reputation!?rep")
			.Where("neq ?rep 30");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(2); // britt and lee
	});

	test('Test Not Expression With Bindings', () => {
		// Given that ?other is jordan, is the statement still not true?
		const query = new DBQuery()
			.Where("not player.relationships.?other.reputation!30");

		const result = query.Run(_db, { "?other": "jordan" });

		expect(result.Success).toBe(true);
	});

	test('Test Compound Not Queries', () => {
		let query;
		let result;

		// For all relationships astrid has with an ?other
		// filter for those where reputation is not 30
		query = new DBQuery()
			.Where("astrid.relationships.?other")
			.Where("not astrid.relationships.?other.reputation!30");

		result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(2); // britt and lee

		// For all relationships astrid has with an ?other
		// filter for those where reputation from astrid to ?other is not 30
		// and ?other does not have a relationship with a spouse tag
		query = new DBQuery()
			.Where("astrid.relationships.?other")
			.Where("not astrid.relationships.?other.reputation!30")
			.Where("not ?other.relationships.?others_spouse.tags.spouse");

		result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(1); // lee

		// For all relationships astrid has with an ?other
		// filter for those where reputation from astrid to ?other is not 30.
		// Also ensure that the player does not have a spouse
		query = new DBQuery()
			.Where("astrid.relationships.?other")
			.Where("not astrid.relationships.?other.reputation!30")
			// below will fail because player has spouse
			.Where("not player.relationships.?x.tags.spouse");

		result = query.Run(_db);

		expect(result.Success).toBe(false);

		// For all relationships astrid has with an ?other
		// filter for those where reputation from astrid to ?other is not 30.
		// Also ensure that the player does not have any friends
		query = new DBQuery()
			.Where("astrid.relationships.?other")
			.Where("not astrid.relationships.?other.reputation!30")
			.Where("not player.relationships.?x.tags.friend");

		result = query.Run(_db);

		expect(result.Success).toBe(true);
	});

	test('Test Compound Query With Vars', () => {
		const query = new DBQuery()
			.Where("?speaker.relationships.?other.reputation!?r0")
			.Where("gt ?r0 10")
			.Where("player.relationships.?other.reputation!?r1")
			.Where("lt ?r1 0")
			.Where("neq ?speaker player");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(1);
	});

	test('Test Results Data Types', () => {
		const query = new DBQuery()
			.Where("?speaker.relationships.?other.reputation!?r0")
			.Where("gt ?r0 10")
			.Where("player.relationships.?other.reputation!?r1")
			.Where("lt ?r1 0")
			.Where("neq ?speaker player");

		const result = query.Run(_db);

		expect(result.Success).toBe(true);
		expect(result.Bindings.length).toBe(1);
		expect(typeof result.Bindings[0].get("?speaker")).toBe('string');
		expect(typeof result.Bindings[0].get("?other")).toBe('string');
		expect(typeof result.Bindings[0].get("?r0")).toBe('number');
		expect(typeof result.Bindings[0].get("?r1")).toBe('number');
	});

	test('Test String Literal', () => {
		const db = new RePraxisDatabase();

		db.Insert("toph.fullName!Toph Beifong");
		db.Insert("toph.displayName!Toph: The greatest Earthbender in the world");

		expect(db.Assert("toph.fullName!Toph Beifong")).toBe(true);

		const queryResult = new DBQuery()
			.Where("toph.fullName!?fullName")
			.Run(db);

		expect(queryResult.Bindings[0].get("?fullName")).toBe("Toph Beifong");
	});

	test('Test Remove Nonexistent Data', () => {
		const db = new RePraxisDatabase();

		db.Delete("katara");

		expect(true).toBe(true); // Ensure no error is thrown
	});

	test('Test Empty Query', () => {
		const db = new RePraxisDatabase();

		const queryResult = new DBQuery().Run(db);

		expect(queryResult.Success).toBe(true);
	});
});
