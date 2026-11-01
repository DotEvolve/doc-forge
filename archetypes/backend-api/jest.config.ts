import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 60000,
  maxWorkers: 1, // Sequential — shared DB/service states
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/types/**'],
  coverageDirectory: 'coverage',
};

export default config;
