require('dotenv').config({
  path: './.env.test'
});

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/jest/env.ts'],
};