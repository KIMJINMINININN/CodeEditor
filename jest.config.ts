import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/e2e/", // ✅ 루트 e2e 무시
    "/playwright-report/",
    "/test-results/",
  ],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@widgets/(.*)$": "<rootDir>/src/widgets/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
  },
};
export default config;
