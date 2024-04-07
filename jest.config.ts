import type { JestConfigWithTsJest } from "ts-jest"
import type { Config } from "@jest/types"

const config: JestConfigWithTsJest = {
    preset: "ts-jest",
    testEnvironment: "node",
    rootDir: __dirname,
    roots: ["<rootDir>/src", "<rootDir>/test"],
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", {
            tsconfig: "<rootDir>/test/tsconfig.json"
        }]
    },
    moduleNameMapper: {
        "^nasturtium(.*)": "<rootDir>/src/$1",
    },
    moduleDirectories: ["<rootDir>/node_modules/"],
    moduleFileExtensions: ["ts", "js"],
    testPathIgnorePatterns: ["/node_modules/"],
    coveragePathIgnorePatterns: []
};``

export default config;
