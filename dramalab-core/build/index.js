"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulation = exports.Agent = exports.Location = void 0;
var Location = /** @class */ (function () {
    function Location(name) {
        this.name = name;
    }
    return Location;
}());
exports.Location = Location;
var Agent = /** @class */ (function () {
    function Agent(simulation, name) {
        this.simulation = simulation;
        this.name = name;
    }
    return Agent;
}());
exports.Agent = Agent;
var Simulation = /** @class */ (function () {
    function Simulation() {
        this.agents = [];
    }
    Simulation.prototype.AddAgent = function (agent) {
        this.agents.push(agent);
    };
    return Simulation;
}());
exports.Simulation = Simulation;
