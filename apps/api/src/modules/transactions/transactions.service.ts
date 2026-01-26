import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { Transaction, TransactionType, Prisma } from '@prisma/client';
import { Decimal } from 'decimal.js';

import { PrismaService } from '../../prisma/prisma.service';
import { AccountsService } from '../accounts/accounts.service';
import { BudgetsService } from '../budgets/budgets.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { TransactionResponseDto, TransactionListResponseDto } from './dto/transaction-response.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accountsService: AccountsService,
    @Inject(forwardRef(() => BudgetsService))
    private readonly budgetsService: BudgetsService,
  ) {}

  /**
   * Create a new transaction
   */
  async create(userId: string, dto: CreateTransactionDto): Promise<TransactionResponseDto> {
    // Validate account ownership
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

      // Validate category type matches transaction type
      if (dto.type === TransactionType.EXPENSE && category.type !== 'EXPENSE') {
        throw new BadRequestException('Category type must match transaction type');
      }
      if (dto.type === TransactionType.INCOME && category.type !== 'INCOME') {
        throw new BadRequestException('Category type must match transaction type');
      }
    }

    // Validate transfer account if transfer type
    let transferToAccount = null;
    if (dto.type === TransactionType.TRANSFER) {
      if (!dto.transferToAccountId) {
        throw new BadRequestException('Transfer requires destination account');
      }

      transferToAccount = await this.prisma.account.findFirst({
        where: { id: dto.transferToAccountId, userId, deletedAt: null },
      });

      if (!transferToAccount) {
        throw new NotFoundException('Destination account not found');
      }

      if (dto.transferToAccountId === dto.accountId) {
        throw new BadRequestException('Cannot transfer to the same account');
      }
    }

    // Parse amount using Decimal for precision
    const amount = new Decimal(dto.amount);

    // Create transaction in a transaction (atomic)
    const result = await this.prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          transferToAccountId: dto.transferToAccountId,
          type: dto.type,
          amount: new Prisma.Decimal(amount.toFixed(2)),
          currency: dto.currency || account.currency,
          description: dto.description,
          notes: dto.notes,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        },
        include: {
          account: true,
          category: true,
          transferToAccount: true,
          tags: { include: { tag: true } },
        },
      });

      // Update account balances
      await this.updateAccountBalances(
        tx,
        dto.type,
        dto.accountId,
        dto.transferToAccountId,
        amount,
      );

      // Handle tags
      if (dto.tagIds && dto.tagIds.length > 0) {
        await tx.transactionTag.createMany({
          data: dto.tagIds.map((tagId) => ({
            transactionId: transaction.id,
            tagId,
          })),
        });
      }

      return transaction;
    });

    // Update budget spent amounts if expense
    if (dto.type === TransactionType.EXPENSE && dto.categoryId) {
      await this.budgetsService.updateSpentAmount(userId, dto.categoryId, result.occurredAt);
    }

    this.logger.log(`Transaction created: ${result.id} for user ${userId}`);
    
    // Fetch complete transaction with relations
    const fullTransaction = await this.prisma.transaction.findUnique({
      where: { id: result.id },
      include: {
        account: true,
        category: true,
        transferToAccount: true,
        tags: { include: { tag: true } },
      },
    });

    return this.mapToResponse(fullTransaction!);
  }

  /**
   * Find all transactions for a user with filters
   */
  async findAll(
    userId: string,
    query: TransactionQueryDto,
  ): Promise<TransactionListResponseDto> {
    const {
      page = 1,
      limit = 20,
      accountId,
      categoryId,
      type,
      startDate,
      endDate,
      search,
      sortBy = 'occurredAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // For endDate, we need to include the entire day, so set time to end of day
    const getEndOfDay = (dateStr: string): Date => {
      const date = new Date(dateStr);
      date.setHours(23, 59, 59, 999);
      return date;
    };

    const where: Prisma.TransactionWhereInput = {
      userId,
      deletedAt: null,
      ...(accountId && { accountId }),
      ...(categoryId && { categoryId }),
      ...(type && { type }),
      ...(startDate || endDate
        ? {
            occurredAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: getEndOfDay(endDate) }),
            },
          }
        : {}),
      ...(search && {
        OR: [
          { description: { contains: search, mode: 'insensitive' as const } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          account: true,
          category: true,
          transferToAccount: true,
          tags: { include: { tag: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Calculate totals
    const totals = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { ...where, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const totalIncome = totals.find((t) => t.type === 'INCOME')?._sum.amount?.toString() || '0';
    const totalExpense = totals.find((t) => t.type === 'EXPENSE')?._sum.amount?.toString() || '0';

    return {
      data: transactions.map((t) => this.mapToResponse(t)),
      total,
      page,
      limit,
      totalIncome,
      totalExpense,
      netAmount: new Decimal(totalIncome).minus(totalExpense).toFixed(2),
    };
  }

  /**
   * Find one transaction by ID
   */
  async findOne(userId: string, transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
        deletedAt: null,
      },
      include: {
        account: true,
        category: true,
        transferToAccount: true,
        tags: { include: { tag: true } },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.mapToResponse(transaction);
  }

  /**
   * Update a transaction
   * Note: For ledger integrity, we create a reversal and a new transaction
   */
  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    const existing = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, deletedAt: null },
      include: { account: true },
    });

    if (!existing) {
      throw new NotFoundException('Transaction not found');
    }

    // For significant changes, we use reversal pattern
    const significantChange =
      dto.amount !== undefined ||
      dto.type !== undefined ||
      dto.accountId !== undefined ||
      dto.transferToAccountId !== undefined;

    if (significantChange) {
      // Create reversal and new transaction
      return this.updateWithReversal(userId, existing, dto);
    }

    // For minor changes (description, category, notes, tags), direct update
    const transaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        categoryId: dto.categoryId,
        description: dto.description,
        notes: dto.notes,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
      include: {
        account: true,
        category: true,
        transferToAccount: true,
        tags: { include: { tag: true } },
      },
    });

    // Update tags if provided
    if (dto.tagIds !== undefined) {
      await this.prisma.transactionTag.deleteMany({
        where: { transactionId },
      });

      if (dto.tagIds.length > 0) {
        await this.prisma.transactionTag.createMany({
          data: dto.tagIds.map((tagId) => ({
            transactionId,
            tagId,
          })),
        });
      }
    }

    this.logger.log(`Transaction updated: ${transactionId}`);
    
    // Refetch to get updated tags
    const updated = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: true,
        category: true,
        transferToAccount: true,
        tags: { include: { tag: true } },
      },
    });

    return this.mapToResponse(updated!);
  }

  /**
   * Soft delete a transaction
   */
  async remove(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId, userId, deletedAt: null },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Create reversal to maintain ledger integrity
    await this.prisma.$transaction(async (tx) => {
      // Reverse account balances
      const reverseAmount = new Decimal(transaction.amount.toString());
      await this.updateAccountBalances(
        tx,
        transaction.type,
        transaction.accountId,
        transaction.transferToAccountId,
        reverseAmount.negated(),
      );

      // Soft delete
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          deletedAt: new Date(),
          status: 'REVERSED',
        },
      });
    });

    // Update budget if was expense
    if (transaction.type === TransactionType.EXPENSE && transaction.categoryId) {
      await this.budgetsService.updateSpentAmount(
        userId,
        transaction.categoryId,
        transaction.occurredAt,
      );
    }

    this.logger.log(`Transaction soft-deleted: ${transactionId}`);
  }

  /**
   * Batch soft delete transactions with balance reversal
   */
  async removeMany(
    userId: string,
    transactionIds: string[],
  ): Promise<{ deletedIds: string[]; failedIds: string[] }> {
    const uniqueIds = Array.from(new Set(transactionIds.filter(Boolean)));
    if (uniqueIds.length === 0) {
      return { deletedIds: [], failedIds: [] };
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { id: { in: uniqueIds }, userId, deletedAt: null },
      select: {
        id: true,
        amount: true,
        type: true,
        accountId: true,
        transferToAccountId: true,
        categoryId: true,
        occurredAt: true,
      },
    });

    const foundIds = new Set(transactions.map((t) => t.id));
    const failedIds = uniqueIds.filter((id) => !foundIds.has(id));

    if (transactions.length === 0) {
      return { deletedIds: [], failedIds };
    }

    const accountDeltas = new Map<string, Decimal>();
    const budgetUpdates = new Map<string, { categoryId: string; occurredAt: Date }>();

    const addDelta = (accountId: string | null | undefined, delta: Decimal) => {
      if (!accountId) return;
      const current = accountDeltas.get(accountId) || new Decimal(0);
      accountDeltas.set(accountId, current.plus(delta));
    };

    const periodKey = (categoryId: string, date: Date) =>
      `${categoryId}-${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

    transactions.forEach((transaction) => {
      const amount = new Decimal(transaction.amount.toString());
      switch (transaction.type) {
        case TransactionType.INCOME:
          addDelta(transaction.accountId, amount.negated());
          break;
        case TransactionType.EXPENSE:
          addDelta(transaction.accountId, amount);
          break;
        case TransactionType.TRANSFER:
          addDelta(transaction.accountId, amount);
          if (transaction.transferToAccountId) {
            addDelta(transaction.transferToAccountId, amount.negated());
          }
          break;
        default:
          break;
      }

      if (transaction.type === TransactionType.EXPENSE && transaction.categoryId) {
        const key = periodKey(transaction.categoryId, transaction.occurredAt);
        if (!budgetUpdates.has(key)) {
          budgetUpdates.set(key, {
            categoryId: transaction.categoryId,
            occurredAt: transaction.occurredAt,
          });
        }
      }
    });

    await this.prisma.$transaction(async (tx) => {
      for (const [accountId, delta] of accountDeltas.entries()) {
        await tx.account.updateMany({
          where: { id: accountId },
          data: { currentBalance: { increment: new Prisma.Decimal(delta.toFixed(2)) } },
        });
      }

      await tx.transaction.updateMany({
        where: { id: { in: transactions.map((t) => t.id) }, userId },
        data: {
          deletedAt: new Date(),
          status: 'REVERSED',
        },
      });
    });

    if (budgetUpdates.size > 0) {
      await Promise.all(
        Array.from(budgetUpdates.values()).map((update) =>
          this.budgetsService.updateSpentAmount(userId, update.categoryId, update.occurredAt),
        ),
      );
    }

    this.logger.log(`Transactions batch deleted: ${transactions.length} for user ${userId}`);
    if (failedIds.length) {
      this.logger.warn(`Batch delete skipped ${failedIds.length} missing transactions`);
    }

    return { deletedIds: transactions.map((t) => t.id), failedIds };
  }

  /**
   * Export transactions as CSV
   */
  async exportCsv(userId: string, query: TransactionQueryDto): Promise<string> {
    const { data } = await this.findAll(userId, { ...query, limit: 10000 });

    const headers = [
      'Date',
      'Type',
      'Amount',
      'Currency',
      'Account',
      'Category',
      'Description',
      'Notes',
      'Tags',
    ];

    const rows = data.map((t) => [
      t.occurredAt.toISOString().split('T')[0],
      t.type,
      t.amount,
      t.currency,
      t.account?.name || '',
      t.category?.name || '',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      t.tags?.map((tag) => tag.name).join(';') || '',
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  /**
   * Update account balances based on transaction type
   */
  private async updateAccountBalances(
    tx: Prisma.TransactionClient,
    type: TransactionType,
    accountId: string,
    transferToAccountId: string | null | undefined,
    amount: Decimal,
  ): Promise<void> {
    const toPrismaDecimal = (value: Decimal) => new Prisma.Decimal(value.toFixed(2));

    switch (type) {
      case TransactionType.INCOME: {
        await tx.account.updateMany({
          where: { id: accountId },
          data: { currentBalance: { increment: toPrismaDecimal(amount) } },
        });
        return;
      }
      case TransactionType.EXPENSE: {
        await tx.account.updateMany({
          where: { id: accountId },
          data: { currentBalance: { increment: toPrismaDecimal(amount.negated()) } },
        });
        return;
      }
      case TransactionType.TRANSFER: {
        await tx.account.updateMany({
          where: { id: accountId },
          data: { currentBalance: { increment: toPrismaDecimal(amount.negated()) } },
        });

        if (transferToAccountId) {
          await tx.account.updateMany({
            where: { id: transferToAccountId },
            data: { currentBalance: { increment: toPrismaDecimal(amount) } },
          });
        }
        return;
      }
      default:
        return;
    }
  }

  /**
   * Update transaction with reversal pattern
   */
  private async updateWithReversal(
    userId: string,
    existing: Transaction & { account: { currency: string } },
    dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Reverse old transaction balances
      const oldAmount = new Decimal(existing.amount.toString());
      await this.updateAccountBalances(
        tx,
        existing.type,
        existing.accountId,
        existing.transferToAccountId,
        oldAmount.negated(),
      );

      // 2. Mark old as reversed
      await tx.transaction.update({
        where: { id: existing.id },
        data: { status: 'REVERSED', deletedAt: new Date() },
      });

      // 3. Create new transaction
      const newAmount = dto.amount ? new Decimal(dto.amount) : oldAmount;
      const newType = dto.type || existing.type;
      const newAccountId = dto.accountId || existing.accountId;
      const newTransferTo = dto.transferToAccountId ?? existing.transferToAccountId;

      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: newAccountId,
          categoryId: dto.categoryId ?? existing.categoryId,
          transferToAccountId: newTransferTo,
          type: newType,
          amount: new Prisma.Decimal(newAmount.toFixed(2)),
          currency: dto.currency || existing.currency,
          description: dto.description ?? existing.description,
          notes: dto.notes ?? existing.notes,
          occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : existing.occurredAt,
          reversesId: existing.id,
        },
        include: {
          account: true,
          category: true,
          transferToAccount: true,
          tags: { include: { tag: true } },
        },
      });

      // 4. Apply new transaction balances
      await this.updateAccountBalances(tx, newType, newAccountId, newTransferTo, newAmount);

      // 5. Link old transaction to new
      await tx.transaction.update({
        where: { id: existing.id },
        data: { reversedById: newTransaction.id },
      });

      return this.mapToResponse(newTransaction);
    });
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(
    transaction: Transaction & {
      account?: { id: string; name: string; currency: string } | null;
      category?: { id: string; name: string; icon: string | null; color: string | null } | null;
      transferToAccount?: { id: string; name: string } | null;
      tags?: { tag: { id: string; name: string; color: string | null } }[];
    },
  ): TransactionResponseDto {
    return {
      id: transaction.id,
      type: transaction.type,
      status: transaction.status,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      description: transaction.description,
      notes: transaction.notes,
      occurredAt: transaction.occurredAt,
      account: transaction.account
        ? {
            id: transaction.account.id,
            name: transaction.account.name,
            currency: transaction.account.currency,
          }
        : null,
      category: transaction.category
        ? {
            id: transaction.category.id,
            name: transaction.category.name,
            icon: transaction.category.icon,
            color: transaction.category.color,
          }
        : null,
      transferToAccount: transaction.transferToAccount
        ? {
            id: transaction.transferToAccount.id,
            name: transaction.transferToAccount.name,
          }
        : null,
      tags: transaction.tags?.map((t) => ({
        id: t.tag.id,
        name: t.tag.name,
        color: t.tag.color,
      })),
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
