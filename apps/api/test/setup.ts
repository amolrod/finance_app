// Jest setup file
import 'reflect-metadata';

// Increase timeout for async tests
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
