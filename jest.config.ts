import type { Config } from '@jest/types';

export default (): Config.InitialOptions => {
  return {
    globals: {
      'ts-jest': {
        astTransformers: {
          before: ['ts-nameof'],
        },
      },
    },
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    coverageReporters: ['lcov', 'html', 'json'],
    verbose: true,
    testMatch: ['**/test/**/*.test.ts'],
  };
};
