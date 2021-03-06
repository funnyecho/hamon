/**
 * Created by samhwang1990@gmail.com.
 */

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  coverageDirectory: 'coverage',
  rootDir: process.cwd(),
  roots: [
      '<rootDir>/libs'
  ],
  setupFilesAfterEnv: [
    require.resolve('./setupTest.js'),
    "jest-extended",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  },
};
