import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { TransactionType, TransactionStatus, AccountType, CategoryType } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: DeepMockProxy<PrismaService>;
  let accountsService: DeepMockProxy<AccountsService>;
  let budgetsService: DeepMockProxy<BudgetsService>;

  const userId = 'user-123';

  const mockAccount = {
    id: 'account-123',
    userId,
    name: 'Checking Account',
    type: AccountType.BANK,
    currency: 'EUR',
    initialBalance: new Prisma.Decimal('1000.00'),
    currentBalance: new Prisma.Decimal('1000.00'),
    icon: null,
    color: null,
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockCategory = {
    id: 'category-123',
    userId,
    name: 'Food',
    type: CategoryType.EXPENSE,
    icon: 'utensils',
    color: '#FF5733',
    parentId: null,
    sortOrder: 0,
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockTransaction = {
    id: 'tx-123',
    userId,
    accountId: mockAccount.id,
    categoryId: mockCategory.id,
    type: TransactionType.EXPENSE,
    amount: new Prisma.Decimal('50.00'),
    currency: 'EUR',
    description: 'Grocery shopping',
    notes: null,
    occurredAt: new Date(),
    status: TransactionStatus.COMPLETED,
    transferToAccountId: null,
    recurringTransactionId: null,
    isRecurring: false,
    recurringRule: null,
    reversedById: null,
    reversesId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    account: mockAccount,
    category: mockCategory,
    transferToAccount: null,
    tags: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: AccountsService,
          useValue: mockDeep<AccountsService>(),
        },
        {
          provide: BudgetsService,
          useValue: mockDeep<BudgetsService>(),
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);
    accountsService = module.get(AccountsService);
    budgetsService = module.get(BudgetsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      accountId: mockAccount.id,
      type: TransactionType.EXPENSE,
      amount: '50.00',
      description: 'Test transaction',
      categoryId: mockCategory.id,
    };

    it('should throw NotFoundException if account not found', async () => {
      prisma.account.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.account.findFirst.mockResolvedValue(mockAccount as any);
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if category type does not match transaction type', async () => {
      prisma.account.findFirst.mockResolvedValue(mockAccount as any);
      prisma.category.findFirst.mockResolvedValue({
        ...mockCategory,
        type: CategoryType.INCOME, // Wrong type for expense
      } as any);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for transfer to same account', async () => {
      const transferDto = {
        accountId: mockAccount.id,
        type: TransactionType.TRANSFER,
        amount: '100.00',
        transferToAccountId: mockAccount.id, // Same account
      };

      prisma.account.findFirst.mockResolvedValue(mockAccount as any);

      await expect(service.create(userId, transferDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for transfer without destination', async () => {
      const transferDto = {
        accountId: mockAccount.id,
        type: TransactionType.TRANSFER,
        amount: '100.00',
        // No transferToAccountId
      };

      prisma.account.findFirst.mockResolvedValue(mockAccount as any);

      await expect(service.create(userId, transferDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      // Mock groupBy for totals calculation
      (prisma.transaction.groupBy as jest.Mock).mockResolvedValue([
        { type: 'INCOME', _sum: { amount: new Prisma.Decimal('100.00') } },
        { type: 'EXPENSE', _sum: { amount: new Prisma.Decimal('50.00') } },
      ]);
    });

    it('should return paginated transactions', async () => {
      prisma.transaction.findMany.mockResolvedValue([mockTransaction] as any);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('page');
      expect(result.data).toHaveLength(1);
    });

    it('should filter by type', async () => {
      prisma.transaction.findMany.mockResolvedValue([mockTransaction] as any);
      prisma.transaction.count.mockResolvedValue(1);

      await service.findAll(userId, { type: TransactionType.EXPENSE });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: TransactionType.EXPENSE,
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const startDate = '2026-01-01';
      const endDate = '2026-01-31';

      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.findAll(userId, { startDate, endDate });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            occurredAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should filter by categoryId', async () => {
      prisma.transaction.findMany.mockResolvedValue([mockTransaction] as any);
      prisma.transaction.count.mockResolvedValue(1);

      await service.findAll(userId, { categoryId: mockCategory.id });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: mockCategory.id,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction as any);

      const result = await service.findOne(userId, mockTransaction.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockTransaction.id);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Updated description',
    };

    it('should update a transaction', async () => {
      const updatedTransaction = {
        ...mockTransaction,
        description: updateDto.description,
      };

      prisma.transaction.findFirst.mockResolvedValue(mockTransaction as any);
      prisma.transaction.update.mockResolvedValue(updatedTransaction as any);
      prisma.transaction.findUnique.mockResolvedValue(updatedTransaction as any);

      const result = await service.update(userId, mockTransaction.id, updateDto);

      expect(result.description).toBe(updateDto.description);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a transaction', async () => {
      prisma.transaction.findFirst.mockResolvedValue(mockTransaction as any);
      // Mock $transaction to execute the callback
      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback({
          account: {
            findUnique: jest.fn().mockResolvedValue(mockAccount),
            update: jest.fn().mockResolvedValue(mockAccount),
          },
          transaction: {
            update: jest.fn().mockResolvedValue({
              ...mockTransaction,
              deletedAt: new Date(),
              status: 'REVERSED',
            }),
          },
        });
      });
      budgetsService.updateSpentAmount.mockResolvedValue(undefined);

      await service.remove(userId, mockTransaction.id);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      prisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
