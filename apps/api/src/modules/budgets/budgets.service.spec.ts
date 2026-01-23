import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { CategoryType, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';

import { BudgetsService } from './budgets.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('BudgetsService', () => {
  let service: BudgetsService;
  let prisma: DeepMockProxy<PrismaService>;

  const userId = 'user-123';
  const currentMonth = '2026-01';

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

  const mockBudget = {
    id: 'budget-123',
    userId,
    categoryId: mockCategory.id,
    periodMonth: currentMonth,
    limitAmount: new Prisma.Decimal('500.00'),
    spentAmount: new Prisma.Decimal('150.00'),
    alertAt80: true,
    alertAt100: true,
    alert80Sent: false,
    alert100Sent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    category: mockCategory,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      categoryId: mockCategory.id,
      periodMonth: currentMonth,
      limitAmount: '500.00',
      alertAt80: true,
      alertAt100: true,
    };

    it('should create a budget successfully', async () => {
      prisma.category.findFirst.mockResolvedValue(mockCategory);
      prisma.budget.findFirst.mockResolvedValue(null);
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('0') },
      } as any);
      prisma.budget.create.mockResolvedValue(mockBudget);

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
      expect(result.categoryId).toBe(mockCategory.id);
      expect(result.periodMonth).toBe(currentMonth);
      expect(prisma.budget.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if budget already exists', async () => {
      prisma.category.findFirst.mockResolvedValue(mockCategory);
      prisma.budget.findFirst.mockResolvedValue(mockBudget);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all budgets for user', async () => {
      prisma.budget.findMany.mockResolvedValue([mockBudget]);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockBudget.id);
    });

    it('should filter by periodMonth', async () => {
      prisma.budget.findMany.mockResolvedValue([mockBudget]);

      await service.findAll(userId, currentMonth);

      expect(prisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            periodMonth: currentMonth,
          }),
        }),
      );
    });

    it('should return empty array when no budgets', async () => {
      prisma.budget.findMany.mockResolvedValue([]);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a single budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);

      const result = await service.findOne(userId, mockBudget.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockBudget.id);
    });

    it('should throw NotFoundException if budget not found', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(service.findOne(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      limitAmount: '600.00',
    };

    it('should update a budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.update.mockResolvedValue({
        ...mockBudget,
        limitAmount: new Prisma.Decimal('600.00'),
      });

      const result = await service.update(userId, mockBudget.id, updateDto);

      expect(result.limitAmount).toBe('600.00');
    });

    it('should throw NotFoundException if budget not found', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.update(userId, 'non-existent-id', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget);
      prisma.budget.delete.mockResolvedValue(mockBudget);

      await service.remove(userId, mockBudget.id);

      expect(prisma.budget.delete).toHaveBeenCalledWith({
        where: { id: mockBudget.id },
      });
    });

    it('should throw NotFoundException if budget not found', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      await expect(service.remove(userId, 'non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatus', () => {
    it('should return budget status for current month', async () => {
      const budgetWithHighSpending = {
        ...mockBudget,
        spentAmount: new Prisma.Decimal('450.00'), // 90% of 500
      };
      prisma.budget.findMany.mockResolvedValue([budgetWithHighSpending]);

      const result = await service.getStatus(userId);

      expect(result).toHaveLength(1);
      expect(result[0].percentageUsed).toBeCloseTo(90, 0);
    });
  });

  describe('updateSpentAmount', () => {
    const transactionDate = new Date('2026-01-15');

    it('should update spent amount for budget', async () => {
      prisma.budget.findFirst.mockResolvedValue(mockBudget as any);
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('200.00') },
      } as any);
      prisma.budget.update.mockResolvedValue({
        ...mockBudget,
        spentAmount: new Prisma.Decimal('200.00'),
      } as any);

      await service.updateSpentAmount(userId, mockCategory.id, transactionDate);

      expect(prisma.budget.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            spentAmount: expect.any(Object),
          }),
        }),
      );
    });

    it('should not throw if budget does not exist', async () => {
      prisma.budget.findFirst.mockResolvedValue(null);

      // Should not throw
      await expect(
        service.updateSpentAmount(userId, mockCategory.id, transactionDate),
      ).resolves.toBeUndefined();
    });
  });
});
