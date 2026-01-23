import { Injectable, NotFoundException, ForbiddenException, Logger, Inject, forwardRef } from '@nestjs/common';
import { Prisma, Account, AccountType } from '@prisma/client';
import { Decimal } from 'decimal.js';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ExchangeRatesService))
    private readonly exchangeRatesService: ExchangeRatesService,
  ) {}

  /**
   * Create a new account
   */
  async create(userId: string, dto: CreateAccountDto): Promise<AccountResponseDto> {
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        currency: dto.currency || 'EUR',
        initialBalance: new Prisma.Decimal(dto.initialBalance || 0),
        currentBalance: new Prisma.Decimal(dto.initialBalance || 0),
        color: dto.color,
        icon: dto.icon,
      },
    });

    this.logger.log(`Account created: ${account.id} for user ${userId}`);
    return this.mapToResponse(account);
  }

  /**
   * Find all accounts for a user
   */
  async findAll(
    userId: string,
    pagination: PaginationDto,
  ): Promise<{ data: AccountResponseDto[]; total: number }> {
    const { page = 1, limit = 20, includeArchived = false } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {
      userId,
      deletedAt: null,
      ...(includeArchived ? {} : { isArchived: false }),
    };

    const [accounts, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.account.count({ where }),
    ]);

    return {
      data: accounts.map((acc) => this.mapToResponse(acc)),
      total,
    };
  }

  /**
   * Find one account by ID
   */
  async findOne(userId: string, accountId: string): Promise<AccountResponseDto> {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.mapToResponse(account);
  }

  /**
   * Update an account
   */
  async update(
    userId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    // Verify ownership
    const existing = await this.prisma.account.findFirst({
      where: { id: accountId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Account not found');
    }

    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        name: dto.name,
        type: dto.type,
        currency: dto.currency,
        color: dto.color,
        icon: dto.icon,
        isArchived: dto.isArchived,
      },
    });

    this.logger.log(`Account updated: ${accountId}`);
    return this.mapToResponse(account);
  }

  /**
   * Soft delete an account
   */
  async remove(userId: string, accountId: string): Promise<void> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId, deletedAt: null },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Check if account has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { accountId, deletedAt: null },
    });

    if (transactionCount > 0) {
      // Archive instead of delete if has transactions
      await this.prisma.account.update({
        where: { id: accountId },
        data: { isArchived: true },
      });
      this.logger.log(`Account archived (has transactions): ${accountId}`);
    } else {
      // Soft delete if no transactions
      await this.prisma.account.update({
        where: { id: accountId },
        data: { deletedAt: new Date() },
      });
      this.logger.log(`Account soft-deleted: ${accountId}`);
    }
  }

  /**
   * Get account summary (total balance across all accounts)
   */
  async getSummary(userId: string, targetCurrency?: string): Promise<{
    totalBalance: string;
    totalBalanceConverted?: string;
    targetCurrency?: string;
    accountCount: number;
    byCurrency: { currency: string; balance: string; balanceConverted?: string }[];
  }> {
    const accounts = await this.prisma.account.findMany({
      where: { userId, deletedAt: null, isArchived: false },
      select: { currency: true, currentBalance: true },
    });

    const byCurrency = accounts.reduce(
      (acc, account) => {
        const currency = account.currency;
        if (!acc[currency]) {
          acc[currency] = new Decimal(0);
        }
        acc[currency] = acc[currency].plus(account.currentBalance.toString());
        return acc;
      },
      {} as Record<string, Decimal>,
    );

    // Si se pide conversión a una moneda específica
    let totalConverted: Decimal | null = null;
    const byCurrencyWithConversion: { currency: string; balance: string; balanceConverted?: string }[] = [];

    if (targetCurrency) {
      totalConverted = new Decimal(0);
      
      for (const [currency, balance] of Object.entries(byCurrency)) {
        let converted: number | null = null;
        
        if (currency === targetCurrency) {
          converted = parseFloat(balance.toFixed(2));
        } else {
          converted = await this.exchangeRatesService.convert(
            parseFloat(balance.toFixed(2)),
            currency,
            targetCurrency
          );
        }

        byCurrencyWithConversion.push({
          currency,
          balance: balance.toFixed(2),
          balanceConverted: converted !== null ? converted.toFixed(2) : undefined,
        });

        if (converted !== null) {
          totalConverted = totalConverted.plus(converted);
        }
      }
    } else {
      for (const [currency, balance] of Object.entries(byCurrency)) {
        byCurrencyWithConversion.push({
          currency,
          balance: balance.toFixed(2),
        });
      }
    }

    return {
      totalBalance: Object.values(byCurrency)
        .reduce((sum, val) => sum.plus(val), new Decimal(0))
        .toFixed(2),
      ...(totalConverted !== null && {
        totalBalanceConverted: totalConverted.toFixed(2),
        targetCurrency,
      }),
      accountCount: accounts.length,
      byCurrency: byCurrencyWithConversion,
    };
  }

  /**
   * Update account balance (internal use)
   */
  async updateBalance(accountId: string, amount: Prisma.Decimal): Promise<void> {
    await this.prisma.account.update({
      where: { id: accountId },
      data: { currentBalance: amount },
    });
  }

  /**
   * Map Prisma model to response DTO
   */
  private mapToResponse(account: Account): AccountResponseDto {
    return {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      initialBalance: account.initialBalance.toString(),
      currentBalance: account.currentBalance.toString(),
      color: account.color,
      icon: account.icon,
      isArchived: account.isArchived,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
