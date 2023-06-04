/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  "testEnvironment": "jsdom",
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.[tj]sx?$': "ts-jest"
  },
  transformIgnorePatterns: ["/node_modules/(?!@shoelace).+\\.js$"]
}

