import type { Config } from 'jest';
const config: Config = {
    testEnvironment: 'jsdom',
    transform: { '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.base.json' }] },
    setupFilesAfterEnv: ['@testing-library/jest-dom'],
    moduleNameMapper: {
        '^@org/monaco-core/(.*)$': '<rootDir>/packages/monaco-core/src/$1',
        '^@org/monaco-react/(.*)$': '<rootDir>/packages/monaco-react/src/$1',
        '^@org/monaco-zip/(.*)$': '<rootDir>/packages/monaco-zip/src/$1'
    }
};
export default config;
