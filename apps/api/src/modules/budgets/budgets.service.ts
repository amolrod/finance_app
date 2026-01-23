import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { Budget, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetResponseDto, BudgetStatusDto } from './dto/budget-response.dto';

@Injectable()
export class BudgetsService {
  private readonly logger = new Logger(BudgetsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto): Promise<BudgetResponseDto> {
    // Validate category exists
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, deletedAt: null, type: 'EXPENSE' },
    });

    if (!category) {
      throw new NotFoundException('Expense category not found');
    }

    // Check for duplicate budget
    const existing = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId: dto.categoryId,
        periodMonth: dto.periodMonth,
      },
    });

    if (existing) {
      throw new ConflictException('Budget already exists for this category and period');
    }

    // Calculate current spent amount
    const spentAmount = await this.calculateSpentAmount(userId, dto.categoryId, dto.periodMonth);

    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        periodMonth: dto.periodMonth,
        limitAmount: new Prisma.Decimal(dto.limitAmount),
        spentAmount: new Prisma.Decimal(spentAmount.toFixed(2)),
        alertAt80: dto.alertAt80 ?? true,
        alertAt100: dto.alertAt100 ?? true,
      },
      include: { category: true },
    });

    this.logger.log(`Budget created: ${budget.id}`);
    return this.mapToResponse(budget);
  }

  async findAll(userId: string, periodMonth?: string): Promise<BudgetResponseDto[]> {
    const where: Prisma.BudgetWhereInput = {
      userId,
      ...(periodMonth && { periodMonth }),
    };

    const budgets = await this.prisma.budget.findMany({
      where,
      include: { category: true },
      orderBy: [{ periodMonth: 'desc' }, { category: { name: 'asc' } }],
    });

    return budgets.map((b) => this.mapToResponse(b));
  }

  async findOne(userId: string, budgetId: string): Promise<BudgetResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
      include: { category: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.mapToResponse(budget);
  }

  async update(userId: string, budgetId: string, dto: UpdateBudgetDto): Promise<BudgetResponseDto> {
    const existing = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Budget not found');
    }

    const budget = await this.prisma.budget.update({
      where: { id: budgetId },
      data: {
        limitAmount: dto.limitAmount ? new Prisma.Decimal(dto.limitAmount) : undefined,
        alertAt80: dto.alertAt80,
        alertAt100: dto.alertAt100,
        // Reset alert sent flags if limit changed
        ...(dto.limitAmount && {
          alert80Sent: false,
          alert100Sent: false,
        }),
      },
      include: { category: true },
    });

    return this.mapToResponse(budget);
  }

  async remove(userId: string, budgetId: string): Promise<void> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.prisma.budget.delete({ where: { id: budgetId } });
    this.logger.log(`Budget deleted: ${budgetId}`);
  }

  /**
   * Get budget status for current period
   */
  async getStatus(userId: string): Promise<BudgetStatusDto[]> {
    const currentMonth = this.getCurrentPeriod();

    const budgets = await this.prisma.budget.findMany({
      where: { userId, periodMonth: currentMonth },
      include: { category: true },
    });

    return budgets.map((budget) => {
      const spent = new Decimal(budget.spentAmount.toString());
      const limit = new Decimal(budget.limitAmount.toString());
      const percentage = limit.isZero() ? new Decimal(0) : spent.dividedBy(limit).times(100);
      const remaining = limit.minus(spent);

      return {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        categoryIcon: budget.category.icon,
        categoryColor: budget.category.color,
        limitAmount: limit.toFixed(2),
        spentAmount: spent.toFixed(2),
        remainingAmount: remaining.toFixed(2),
        percentageUsed: Math.min(percentage.toNumber(), 100),
        isOverBudget: spent.greaterThan(limit),
        isWarning: percentage.greaterThanOrEqualTo(80) && percentage.lessThan(100),
      };
    });
  }

  /**
   * Update spent amount for a category's budget (called when transactions change)
   */
  async updateSpentAmount(userId: string, categoryId: string, transactionDate: Date): Promise<void> {
    const periodMonth = this.getPeriodFromDate(transactionDate);

    const budget = await this.prisma.budget.findFirst({
      where: { userId, categoryId, periodMonth },
    });

    if (!budget) {
      return; // No budget for this category/period
    }

    const spentAmount = await this.calculateSpentAmount(userId, categoryId, periodMonth);

    const limit = new Decimal(budget.limitAmount.toString());
    const percentage = limit.isZero() ? new Decimal(0) : spentAmount.dividedBy(limit).times(100);

    // Check if we need to send alerts
    const shouldAlert80 = 
      budget.alertAt80 && 
      !budget.alert80Sent && 
      percentage.greaterThanOrEqualTo(80);

    const shouldAlert100 = 
      budget.alertAt100 && 
      !budget.alert100Sent && 
      percentage.greaterThanOrEqualTo(100);

    await this.prisma.budget.update({
      where: { id: budget.id },
      data: {
        spentAmount: new Prisma.Decimal(spentAmount.toFixed(2)),
        alert80Sent: shouldAlert80 ? true : budget.alert80Sent,
        alert100Sent: shouldAlert100 ? true : budget.alert100Sent,
      },
    });

    // Create notifications if alerts triggered
    if (shouldAlert80) {
      await this.createBudgetNotification(
        userId,
        budget.id,
        'BUDGET_WARNING',
        `Budget at 80%`,
        `You've used ${percentage.toFixed(0)}% of your budget for this category.`,
      );
    }

    if (shouldAlert100) {
      await this.createBudgetNotification(
        userId,
        budget.id,
        'BUDGET_EXCEEDED',
        `Budget exceeded`,
        `You've exceeded your budget limit for this category.`,
      );
    }
  }

  /**
   * Calculate spent amount for a category in a period
   */
  private async calculateSpentAmount(
    userId: string,
    categoryId: string,
    periodMonth: string,
  ): Promise<Decimal> {
    const [year, month] = periodMonth.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        status: 'COMPLETED',
        deletedAt: null,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    return new Decimal(result._sum.amount?.toString() || '0');
  }

  /**
   * Create a budget notification
   */
  private async createBudgetNotification(
    userId: string,
    budgetId: string,
    type: 'BUDGET_WARNING' | 'BUDGET_EXCEEDED',
    title: string,
    message: string,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        payload: { budgetId },
      },
    });

    this.logger.log(`Budget notification created: ${type} for user ${userId}`);
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private getPeriodFromDate(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  private mapToResponse(
    budget: Budget & { category: { name: string; icon: string | null; color: string | null } },
  ): BudgetResponseDto {
    const spent = new Decimal(budget.spentAmount.toString());
    const limit = new Decimal(budget.limitAmount.toString());
    const percentage = limit.isZero() ? 0 : spent.dividedBy(limit).times(100).toNumber();

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryIcon: budget.category.icon,
      categoryColor: budget.category.color,
      periodMonth: budget.periodMonth,
      limitAmount: limit.toFixed(2),
      spentAmount: spent.toFixed(2),
      remainingAmount: limit.minus(spent).toFixed(2),
      percentageUsed: Math.min(percentage, 100),
      alertAt80: budget.alertAt80,
      alertAt100: budget.alertAt100,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
}
