import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRecurringTransactionDto,
  UpdateRecurringTransactionDto,
  RecurringTransactionQueryDto,
} from './dto';
import { RecurrenceFrequency, Prisma } from '@prisma/client';

@Injectable()
export class RecurringTransactionsService {
  private readonly logger = new Logger(RecurringTransactionsService.name);

  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    // Validate account belongs to user
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, deletedAt: null },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Calculate next occurrence based on frequency and start date
    const startDate = new Date(dto.startDate);
    const nextOccurrence = this.calculateNextOccurrence(
      startDate,
      dto.frequency,
      dto.dayOfMonth,
      dto.dayOfWeek,
    );

    // Validate day of month/week based on frequency
    this.validateFrequencyConfig(dto.frequency, dto.dayOfMonth, dto.dayOfWeek);

    return this.prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: new Prisma.Decimal(dto.amount),
        currency: dto.currency || 'EUR',
        description: dto.description,
        notes: dto.notes,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        dayOfWeek: dto.dayOfWeek,
        startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        nextOccurrence,
        autoConfirm: dto.autoConfirm ?? true,
        notifyBeforeDays: dto.notifyBeforeDays ?? 1,
      },
      include: {
        account: true,
        category: true,
      },
    });
  }

  async findAll(userId: string, query: RecurringTransactionQueryDto) {
    const where: Prisma.RecurringTransactionWhereInput = {
      userId,
      deletedAt: null,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.frequency) {
      where.frequency = query.frequency;
    }
    if (query.accountId) {
      where.accountId = query.accountId;
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    return this.prisma.recurringTransaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextOccurrence: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const recurring = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        account: true,
        category: true,
      },
    });

    if (!recurring) {
      throw new NotFoundException('Recurring transaction not found');
    }

    return recurring;
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    const recurring = await this.findOne(userId, id);

    // Validate account if changing
    if (dto.accountId && dto.accountId !== recurring.accountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId, deletedAt: null },
      });
      if (!account) {
        throw new NotFoundException('Account not found');
      }
    }

    // Validate category if changing
    if (dto.categoryId && dto.categoryId !== recurring.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate frequency config if changing
    const newFrequency = dto.frequency || recurring.frequency;
    const newDayOfMonth = dto.dayOfMonth !== undefined ? dto.dayOfMonth : recurring.dayOfMonth;
    const newDayOfWeek = dto.dayOfWeek !== undefined ? dto.dayOfWeek : recurring.dayOfWeek;
    this.validateFrequencyConfig(newFrequency, newDayOfMonth, newDayOfWeek);

    // Recalculate next occurrence if frequency changes
    let nextOccurrence = recurring.nextOccurrence;
    if (dto.frequency && dto.frequency !== recurring.frequency) {
      nextOccurrence = this.calculateNextOccurrence(
        recurring.startDate,
        dto.frequency,
        newDayOfMonth,
        newDayOfWeek,
      );
    }

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: dto.amount ? new Prisma.Decimal(dto.amount) : undefined,
        currency: dto.currency,
        description: dto.description,
        notes: dto.notes,
        frequency: dto.frequency,
        dayOfMonth: dto.dayOfMonth,
        dayOfWeek: dto.dayOfWeek,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
        autoConfirm: dto.autoConfirm,
        notifyBeforeDays: dto.notifyBeforeDays,
        nextOccurrence,
      },
      include: {
        account: true,
        category: true,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async pause(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: { isActive: false },
      include: {
        account: true,
        category: true,
      },
    });
  }

  async resume(userId: string, id: string) {
    const recurring = await this.findOne(userId, id);

    // Recalculate next occurrence from today
    const nextOccurrence = this.calculateNextOccurrence(
      new Date(),
      recurring.frequency,
      recurring.dayOfMonth,
      recurring.dayOfWeek,
    );

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        isActive: true,
        nextOccurrence,
      },
      include: {
        account: true,
        category: true,
      },
    });
  }

  // Get transactions due for execution
  async getDueTransactions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.recurringTransaction.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        nextOccurrence: {
          lte: today,
        },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: {
        account: true,
        category: true,
        user: true,
      },
    });
  }

  // Update after transaction is created
  async markExecuted(id: string) {
    const recurring = await this.prisma.recurringTransaction.findUnique({
      where: { id },
    });

    if (!recurring) {
      throw new NotFoundException('Recurring transaction not found');
    }

    const nextOccurrence = this.calculateNextOccurrence(
      recurring.nextOccurrence,
      recurring.frequency,
      recurring.dayOfMonth,
      recurring.dayOfWeek,
      true, // advance from current
    );

    // Check if we've passed the end date
    let isActive = recurring.isActive;
    if (recurring.endDate && nextOccurrence > recurring.endDate) {
      isActive = false;
    }

    return this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        lastOccurrence: recurring.nextOccurrence,
        nextOccurrence,
        executionCount: { increment: 1 },
        isActive,
      },
    });
  }

  // Get upcoming transactions for preview
  async getUpcoming(userId: string, days: number = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const recurring = await this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        deletedAt: null,
        nextOccurrence: {
          lte: futureDate,
        },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextOccurrence: 'asc' },
    });

    // Generate preview of upcoming transactions
    const upcoming: Array<{
      recurringId: string;
      date: Date;
      description: string;
      amount: number;
      type: string;
      accountName: string;
      categoryName: string | null;
    }> = [];

    for (const rec of recurring) {
      let date = new Date(rec.nextOccurrence);
      while (date <= futureDate && (!rec.endDate || date <= rec.endDate)) {
        upcoming.push({
          recurringId: rec.id,
          date: new Date(date),
          description: rec.description,
          amount: rec.amount.toNumber(),
          type: rec.type,
          accountName: rec.account.name,
          categoryName: rec.category?.name || null,
        });

        // Calculate next date
        date = this.calculateNextOccurrence(
          date,
          rec.frequency,
          rec.dayOfMonth,
          rec.dayOfWeek,
          true,
        );
      }
    }

    // Sort by date
    upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

    return upcoming;
  }

  private calculateNextOccurrence(
    fromDate: Date,
    frequency: RecurrenceFrequency,
    dayOfMonth?: number | null,
    dayOfWeek?: number | null,
    advance: boolean = false,
  ): Date {
    const date = new Date(fromDate);
    if (advance) {
      // Move to next period
      switch (frequency) {
        case RecurrenceFrequency.DAILY:
          date.setDate(date.getDate() + 1);
          break;
        case RecurrenceFrequency.WEEKLY:
          date.setDate(date.getDate() + 7);
          break;
        case RecurrenceFrequency.BIWEEKLY:
          date.setDate(date.getDate() + 14);
          break;
        case RecurrenceFrequency.MONTHLY:
          date.setMonth(date.getMonth() + 1);
          break;
        case RecurrenceFrequency.QUARTERLY:
          date.setMonth(date.getMonth() + 3);
          break;
        case RecurrenceFrequency.YEARLY:
          date.setFullYear(date.getFullYear() + 1);
          break;
      }
    }

    // Adjust to specific day if needed
    if (dayOfMonth && ['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(frequency)) {
      // Handle months with fewer days
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(dayOfMonth, lastDayOfMonth));
    }

    if (dayOfWeek !== null && dayOfWeek !== undefined && ['WEEKLY', 'BIWEEKLY'].includes(frequency)) {
      const currentDay = date.getDay();
      const diff = dayOfWeek - currentDay;
      if (diff > 0 || (diff === 0 && !advance)) {
        date.setDate(date.getDate() + diff);
      } else if (advance) {
        // Already advanced by a week, adjust to correct day
        date.setDate(date.getDate() + diff);
      }
    }

    return date;
  }

  private validateFrequencyConfig(
    frequency: RecurrenceFrequency,
    dayOfMonth?: number | null,
    dayOfWeek?: number | null,
  ) {
    if (['MONTHLY', 'QUARTERLY', 'YEARLY'].includes(frequency)) {
      if (dayOfMonth === null || dayOfMonth === undefined) {
        throw new BadRequestException(
          `dayOfMonth is required for ${frequency} frequency`,
        );
      }
    }

    if (['WEEKLY', 'BIWEEKLY'].includes(frequency)) {
      if (dayOfWeek === null || dayOfWeek === undefined) {
        throw new BadRequestException(
          `dayOfWeek is required for ${frequency} frequency`,
        );
      }
    }
  }
}
