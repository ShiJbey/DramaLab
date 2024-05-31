import { describe, expect, test } from "@jest/globals";
import { Agent, Simulation } from "../src";

describe("DramaLab Core", () => {
	test("Add agent to simulation", () => {
		const sim = new Simulation();

		const agent = new Agent(sim, "Agent A");

		expect(sim.agents.length).toBe(0);

		sim.AddAgent(agent);

		expect(sim.agents.length).toBe(1);
	});
});
