/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: [
		"./packages/repraxis-js/tests",
		"./packages/tdrs-js/tests",
		"./packages/dramalab-core/tests"
	]
};
