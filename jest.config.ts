import type { Config } from 'jest';
const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    moduleNameMapper: {
        '\\.(css|scss)$': 'identity-obj-proxy',
        '^monaco-editor$': '<rootDir>/__mocks__/monaco-editor.ts'
    }
};
export default config;
