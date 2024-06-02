"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const src_1 = require("../src");
const _db = new src_1.RePraxisDatabase();
(0, globals_1.beforeAll)(() => {
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
(0, globals_1.describe)("RePraxis JS", () => {
    (0, globals_1.test)("Test Insert Sentence", () => {
        const db = new src_1.RePraxisDatabase();
        db.Insert("A.relationships.B.reputation!10");
        db.Insert("A.relationships.B.type!rivalry");
        (0, globals_1.expect)(db.Assert("A.relationships.B.reputation!19")).toBe(false);
        (0, globals_1.expect)(db.Assert("A.relationships.B.type")).toBe(true);
        (0, globals_1.expect)(db.Assert("A")).toBe(true);
    });
    (0, globals_1.test)("Test Delete Sentence", () => {
        const db = new src_1.RePraxisDatabase();
        db.Insert("A.relationships.B.reputation!10");
        db.Delete("A.relationships.B.reputation");
        (0, globals_1.expect)(db.Assert("A.relationships.B.reputation")).toBe(false);
    });
    (0, globals_1.test)("Test Update Sentence", () => {
        const db = new src_1.RePraxisDatabase();
        db.Insert("A.relationships.B.reputation!10");
        db.Insert("A.relationships.B.reputation!-99");
        (0, globals_1.expect)(db.Assert("A.relationships.B.reputation!-99")).toBe(true);
        (0, globals_1.expect)(db.Assert("A.relationships.B.reputation.-99")).toBe(false);
    });
    (0, globals_1.test)("Test Assert Expression With No Vars", () => {
        const query = new src_1.DBQuery()
            .Where("astrid.relationships.britt");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(0);
    });
    (0, globals_1.test)("Test Failing Assert Expression No Vars", () => {
        const query = new src_1.DBQuery()
            .Where("astrid.relationships.haley");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(false);
        (0, globals_1.expect)(result.Bindings.length).toBe(0);
    });
    (0, globals_1.test)("Test GTE Expression", () => {
        const query = new src_1.DBQuery()
            .Where("astrid.relationships.?other.reputation!?r")
            .Where("gte ?r 10");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(2);
    });
    (0, globals_1.test)("Test GTE Expression with Bindings", () => {
        const query = new src_1.DBQuery()
            .Where("astrid.relationships.?other.reputation!?r")
            .Where("gte ?r 10");
        const result = query.Run(_db, { "?other": "lee" });
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(1);
    });
    (0, globals_1.test)("Test LTE With Multiple Variables", () => {
        const query = new src_1.DBQuery()
            .Where("?A.relationships.?other.reputation!?r")
            .Where("lte ?r 0");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(2);
    });
    (0, globals_1.test)("Test Not Expression", () => {
        const query = new src_1.DBQuery()
            .Where("not player.relationships.jordan.reputation!30");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
    });
    (0, globals_1.test)("Test Not Expression with Variables", () => {
        const query = new src_1.DBQuery()
            .Where("not astrid.relationships.?other.reputation!15");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
    });
    (0, globals_1.test)('Test Neq Expression With Vars', () => {
        const query = new src_1.DBQuery()
            .Where("astrid.relationships.?other.reputation!?rep")
            .Where("neq ?rep 30");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(2);
    });
    (0, globals_1.test)('Test Not Expression With Bindings', () => {
        const query = new src_1.DBQuery()
            .Where("not player.relationships.?other.reputation!30");
        const result = query.Run(_db, { "?other": "jordan" });
        (0, globals_1.expect)(result.Success).toBe(true);
    });
    (0, globals_1.test)('Test Compound Not Queries', () => {
        let query;
        let result;
        query = new src_1.DBQuery()
            .Where("astrid.relationships.?other")
            .Where("not astrid.relationships.?other.reputation!30");
        result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(2);
        query = new src_1.DBQuery()
            .Where("astrid.relationships.?other")
            .Where("not astrid.relationships.?other.reputation!30")
            .Where("not ?other.relationships.?others_spouse.tags.spouse");
        result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(1);
        query = new src_1.DBQuery()
            .Where("astrid.relationships.?other")
            .Where("not astrid.relationships.?other.reputation!30")
            .Where("not player.relationships.?x.tags.spouse");
        result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(false);
        query = new src_1.DBQuery()
            .Where("astrid.relationships.?other")
            .Where("not astrid.relationships.?other.reputation!30")
            .Where("not player.relationships.?x.tags.friend");
        result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
    });
    (0, globals_1.test)('Test Compound Query With Vars', () => {
        const query = new src_1.DBQuery()
            .Where("?speaker.relationships.?other.reputation!?r0")
            .Where("gt ?r0 10")
            .Where("player.relationships.?other.reputation!?r1")
            .Where("lt ?r1 0")
            .Where("neq ?speaker player");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(1);
    });
    (0, globals_1.test)('Test Results Data Types', () => {
        const query = new src_1.DBQuery()
            .Where("?speaker.relationships.?other.reputation!?r0")
            .Where("gt ?r0 10")
            .Where("player.relationships.?other.reputation!?r1")
            .Where("lt ?r1 0")
            .Where("neq ?speaker player");
        const result = query.Run(_db);
        (0, globals_1.expect)(result.Success).toBe(true);
        (0, globals_1.expect)(result.Bindings.length).toBe(1);
        (0, globals_1.expect)(typeof result.Bindings[0].get("?speaker")).toBe('string');
        (0, globals_1.expect)(typeof result.Bindings[0].get("?other")).toBe('string');
        (0, globals_1.expect)(typeof result.Bindings[0].get("?r0")).toBe('number');
        (0, globals_1.expect)(typeof result.Bindings[0].get("?r1")).toBe('number');
    });
    (0, globals_1.test)('Test String Literal', () => {
        const db = new src_1.RePraxisDatabase();
        db.Insert("toph.fullName!Toph Beifong");
        db.Insert("toph.displayName!Toph: The greatest Earthbender in the world");
        (0, globals_1.expect)(db.Assert("toph.fullName!Toph Beifong")).toBe(true);
        const queryResult = new src_1.DBQuery()
            .Where("toph.fullName!?fullName")
            .Run(db);
        (0, globals_1.expect)(queryResult.Bindings[0].get("?fullName")).toBe("Toph Beifong");
    });
    (0, globals_1.test)('Test Remove Nonexistent Data', () => {
        const db = new src_1.RePraxisDatabase();
        db.Delete("katara");
        (0, globals_1.expect)(true).toBe(true);
    });
    (0, globals_1.test)('Test Empty Query', () => {
        const db = new src_1.RePraxisDatabase();
        const queryResult = new src_1.DBQuery().Run(db);
        (0, globals_1.expect)(queryResult.Success).toBe(true);
    });
});
//# sourceMappingURL=repraxis.test.js.map