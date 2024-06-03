import { describe, expect, test } from "@jest/globals";
import { Agent, Simulation } from "../src";

describe("DramaLab Core", () => {
	test("Add agent to simulation", () => {
		const sim = new Simulation();

		const agent = new Agent(sim, "a", "Agent A");

		expect(sim.agents.size).toBe(0);

		sim.addAgent(agent);

		expect(sim.agents.size).toBe(1);
	});
});
