import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import { PrismaService } from '../src/prisma/prisma.service';

// Create a mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaService>;

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});
