import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import {
  CreateInvestmentOperationDto,
  UpdateInvestmentOperationDto,
  InvestmentOperationQueryDto,
} from './dto';
import { Prisma, OperationType, NotificationType } from '@prisma/client';
import Decimal from 'decimal.js';
import { MarketPriceService } from './market-price.service';

export interface PriceHistoryResponse {
  range: string;
  assets: {
    assetId: string;
    symbol: string;
    currency: string;
    points: { date: string; price: number; currency: string }[];
  }[];
}

export interface HoldingSummary {
  assetId: string;
  symbol: string;
  name: string;
  type: string;
  quantity: Decimal;
  averageCost: Decimal;
  totalInvested: Decimal;
  currentPrice: Decimal | null;
  currentValue: Decimal | null;
  unrealizedPnL: Decimal | null;
  unrealizedPnLPercent: Decimal | null;
  realizedPnL: Decimal;
  currency: string;
}

export interface PortfolioSummary {
  totalInvested: Decimal;
  totalCurrentValue: Decimal | null;
  totalUnrealizedPnL: Decimal | null;
  totalRealizedPnL: Decimal;
  holdings: HoldingSummary[];
  byAssetType: Record<string, { invested: Decimal; currentValue: Decimal | null; count: number }>;
}

@Injectable()
export class InvestmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeRatesService: ExchangeRatesService,
    private readonly marketPriceService: MarketPriceService,
  ) {}

  private isMissingGoalsTable(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021' &&
      error.message.includes('investment_goals')
    );
  }

  async create(userId: string, dto: CreateInvestmentOperationDto) {
    // Verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${dto.assetId} not found`);
    }

    // Calculate total amount
    const quantity = new Decimal(dto.quantity);
    const pricePerUnit = new Decimal(dto.pricePerUnit);
    const fees = new Decimal(dto.fees || 0);
    let totalAmount = quantity.mul(pricePerUnit);

    // For buys, add fees; for sells, subtract from proceeds
    if (dto.type === OperationType.BUY) {
      totalAmount = totalAmount.plus(fees);
    } else if (dto.type === OperationType.SELL) {
      totalAmount = totalAmount.minus(fees);
    } else if (dto.type === OperationType.DIVIDEND) {
      totalAmount = new Decimal(dto.pricePerUnit); // For dividends, pricePerUnit is total amount
    }

    return this.prisma.investmentOperation.create({
      data: {
        userId,
        assetId: dto.assetId,
        type: dto.type,
        quantity: dto.quantity,
        pricePerUnit: dto.pricePerUnit,
        totalAmount: totalAmount.toNumber(),
        fees: dto.fees || 0,
        currency: dto.currency || asset.currency,
        platform: dto.platform || null,
        occurredAt: new Date(dto.occurredAt),
        notes: dto.notes,
      },
      include: {
        asset: true,
      },
    });
  }

  async createBatch(userId: string, operations: CreateInvestmentOperationDto[]) {
    if (!operations.length) {
      return { created: 0 };
    }

    const assetIds = Array.from(new Set(operations.map((op) => op.assetId)));
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
    });
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    const missing = assetIds.filter((id) => !assetMap.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Assets not found: ${missing.join(', ')}`);
    }

    const data = operations.map((dto) => {
      const asset = assetMap.get(dto.assetId)!;
      const quantity = new Decimal(dto.quantity);
      const pricePerUnit = new Decimal(dto.pricePerUnit);
      const fees = new Decimal(dto.fees || 0);
      let totalAmount = quantity.mul(pricePerUnit);

      if (dto.type === OperationType.BUY) {
        totalAmount = totalAmount.plus(fees);
      } else if (dto.type === OperationType.SELL) {
        totalAmount = totalAmount.minus(fees);
      } else if (dto.type === OperationType.DIVIDEND) {
        totalAmount = new Decimal(dto.pricePerUnit);
      }

      return {
        userId,
        assetId: dto.assetId,
        type: dto.type,
        quantity: dto.quantity,
        pricePerUnit: dto.pricePerUnit,
        totalAmount: totalAmount.toNumber(),
        fees: dto.fees || 0,
        currency: dto.currency || asset.currency,
        platform: dto.platform || null,
        occurredAt: new Date(dto.occurredAt),
        notes: dto.notes,
      };
    });

    const created = await this.prisma.investmentOperation.createMany({
      data,
    });

    return { created: created.count };
  }

  async findAll(userId: string, query: InvestmentOperationQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentOperationWhereInput = {
      userId,
      deletedAt: null,
    };

    if (query.assetId) {
      where.assetId = query.assetId;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.startDate || query.endDate) {
      where.occurredAt = {};
      if (query.startDate) {
        where.occurredAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.occurredAt.lte = new Date(query.endDate);
      }
    }

    const [operations, total] = await Promise.all([
      this.prisma.investmentOperation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { occurredAt: 'desc' },
        include: {
          asset: true,
        },
      }),
      this.prisma.investmentOperation.count({ where }),
    ]);

    return {
      data: operations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string) {
    const operation = await this.prisma.investmentOperation.findFirst({
      where: { id, userId, deletedAt: null },
      include: { asset: true },
    });

    if (!operation) {
      throw new NotFoundException(`Operation with ID ${id} not found`);
    }

    return operation;
  }

  async update(userId: string, id: string, dto: UpdateInvestmentOperationDto) {
    const operation = await this.findOne(userId, id);

    // If assetId is being changed, verify the new asset exists
    if (dto.assetId && dto.assetId !== operation.assetId) {
      const asset = await this.prisma.asset.findUnique({
        where: { id: dto.assetId },
      });
      if (!asset) {
        throw new NotFoundException(`Asset with ID ${dto.assetId} not found`);
      }
    }

    // Recalculate total if quantity or price changed
    const quantity = new Decimal(dto.quantity ?? operation.quantity.toString());
    const pricePerUnit = new Decimal(dto.pricePerUnit ?? operation.pricePerUnit.toString());
    const fees = new Decimal(dto.fees ?? operation.fees.toString());
    const type = dto.type ?? operation.type;

    let totalAmount = quantity.mul(pricePerUnit);
    if (type === OperationType.BUY) {
      totalAmount = totalAmount.plus(fees);
    } else if (type === OperationType.SELL) {
      totalAmount = totalAmount.minus(fees);
    } else if (type === OperationType.DIVIDEND) {
      totalAmount = pricePerUnit;
    }

    return this.prisma.investmentOperation.update({
      where: { id },
      data: {
        assetId: dto.assetId,
        type: dto.type,
        quantity: dto.quantity,
        pricePerUnit: dto.pricePerUnit,
        totalAmount: totalAmount.toNumber(),
        fees: dto.fees,
        currency: dto.currency,
        platform: dto.platform !== undefined ? (dto.platform || null) : undefined,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: { asset: true },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    // Soft delete
    return this.prisma.investmentOperation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Calculate current holdings for a user
   */
  async getHoldings(userId: string): Promise<HoldingSummary[]> {
    // Get all operations grouped by asset
    const operations = await this.prisma.investmentOperation.findMany({
      where: { userId, deletedAt: null },
      orderBy: { occurredAt: 'asc' },
    });

    if (operations.length === 0) {
      return [];
    }

    const assetIds = Array.from(new Set(operations.map((op) => op.assetId)));
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      include: { prices: { take: 1, orderBy: { fetchedAt: 'desc' } } },
    });
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    // Group operations by asset
    const holdingsMap = new Map<string, {
      asset: (typeof assets)[number];
      operations: typeof operations;
    }>();

    for (const op of operations) {
      const asset = assetMap.get(op.assetId);
      if (!asset) {
        continue;
      }
      const existing = holdingsMap.get(op.assetId);
      if (existing) {
        existing.operations.push(op);
      } else {
        holdingsMap.set(op.assetId, {
          asset,
          operations: [op],
        });
      }
    }

    // Calculate holdings for each asset
    const holdings: HoldingSummary[] = [];

    for (const [assetId, data] of holdingsMap) {
      let quantity = new Decimal(0);
      let totalCost = new Decimal(0);
      let realizedPnL = new Decimal(0);

      // Track lots for FIFO calculation
      const lots: { quantity: Decimal; costPerUnit: Decimal }[] = [];

      for (const op of data.operations) {
        const opQty = new Decimal(op.quantity.toString());
        const opPrice = new Decimal(op.pricePerUnit.toString());
        const opFees = new Decimal(op.fees.toString());
        const isZeroQty = opQty.lte(0);

        switch (op.type) {
          case OperationType.BUY:
            if (isZeroQty) {
              continue;
            }
            lots.push({ quantity: opQty, costPerUnit: opPrice.plus(opFees.div(opQty)) });
            quantity = quantity.plus(opQty);
            totalCost = totalCost.plus(opQty.mul(opPrice)).plus(opFees);
            break;

          case OperationType.SELL:
            if (isZeroQty) {
              continue;
            }
            // FIFO: sell from oldest lots first
            let remainingToSell = opQty;
            let costBasis = new Decimal(0);

            while (remainingToSell.gt(0) && lots.length > 0) {
              const lot = lots[0];
              const sellFromLot = Decimal.min(remainingToSell, lot.quantity);
              
              costBasis = costBasis.plus(sellFromLot.mul(lot.costPerUnit));
              lot.quantity = lot.quantity.minus(sellFromLot);
              remainingToSell = remainingToSell.minus(sellFromLot);

              if (lot.quantity.lte(0)) {
                lots.shift();
              }
            }

            const proceeds = opQty.mul(opPrice).minus(opFees);
            realizedPnL = realizedPnL.plus(proceeds.minus(costBasis));
            quantity = quantity.minus(opQty);
            totalCost = totalCost.minus(costBasis);
            break;

          case OperationType.DIVIDEND:
            realizedPnL = realizedPnL.plus(new Decimal(op.totalAmount.toString()));
            break;

          case OperationType.SPLIT:
            if (isZeroQty) {
              continue;
            }
            // Adjust quantity and lot sizes
            const splitRatio = opQty;
            quantity = quantity.mul(splitRatio);
            for (const lot of lots) {
              lot.quantity = lot.quantity.mul(splitRatio);
              lot.costPerUnit = lot.costPerUnit.div(splitRatio);
            }
            break;
        }
      }

      // Skip if no position
      if (quantity.lte(0)) {
        if (!realizedPnL.isZero()) {
          // Still show if there's realized P&L
          holdings.push({
            assetId,
            symbol: data.asset.symbol,
            name: data.asset.name,
            type: data.asset.type,
            quantity: new Decimal(0),
            averageCost: new Decimal(0),
            totalInvested: new Decimal(0),
            currentPrice: null,
            currentValue: new Decimal(0),
            unrealizedPnL: new Decimal(0),
            unrealizedPnLPercent: new Decimal(0),
            realizedPnL,
            currency: data.asset.currency,
          });
        }
        continue;
      }

      const averageCost = quantity.gt(0) ? totalCost.div(quantity) : new Decimal(0);
      const latestPriceRecord = data.asset.prices[0];
      const latestPrice = latestPriceRecord?.price
        ? new Decimal(latestPriceRecord.price.toString())
        : null;
      const assetCurrency = data.asset.currency || 'USD';
      const priceCurrencyRaw = latestPriceRecord?.currency || assetCurrency;
      const isPence = priceCurrencyRaw === 'GBp' || priceCurrencyRaw === 'GBX';
      const priceCurrency = isPence ? 'GBP' : priceCurrencyRaw;
      const normalizedPrice = isPence && latestPrice ? latestPrice.div(100) : latestPrice;
      let effectivePrice: Decimal | null = normalizedPrice;

      let currentValue: Decimal | null = null;
      let unrealizedPnL: Decimal | null = null;
      let unrealizedPnLPercent: Decimal | null = null;

      if (normalizedPrice) {
        if (priceCurrency !== assetCurrency) {
          const converted = await this.exchangeRatesService.convert(
            normalizedPrice.toNumber(),
            priceCurrency,
            assetCurrency,
          );
          effectivePrice = converted !== null ? new Decimal(converted) : null;
        }
      }

      if (effectivePrice) {
        currentValue = quantity.mul(effectivePrice);
        unrealizedPnL = currentValue.minus(totalCost);
        unrealizedPnLPercent = totalCost.gt(0) 
          ? unrealizedPnL.div(totalCost).mul(100) 
          : new Decimal(0);
      }

      holdings.push({
        assetId,
        symbol: data.asset.symbol,
        name: data.asset.name,
        type: data.asset.type,
        quantity,
        averageCost,
        totalInvested: totalCost,
        currentPrice: effectivePrice,
        currentValue,
        unrealizedPnL,
        unrealizedPnLPercent,
        realizedPnL,
        currency: assetCurrency,
      });
    }

    return holdings.sort((a, b) => {
      const aValue = a.currentValue?.toNumber() ?? a.totalInvested.toNumber();
      const bValue = b.currentValue?.toNumber() ?? b.totalInvested.toNumber();
      return bValue - aValue;
    });
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    const holdings = await this.getHoldings(userId);

    let totalInvested = new Decimal(0);
    let totalCurrentValue: Decimal | null = new Decimal(0);
    let totalUnrealizedPnL: Decimal | null = new Decimal(0);
    let totalRealizedPnL = new Decimal(0);
    const byAssetType: Record<string, { invested: Decimal; currentValue: Decimal | null; count: number }> = {};

    for (const holding of holdings) {
      totalInvested = totalInvested.plus(holding.totalInvested);
      totalRealizedPnL = totalRealizedPnL.plus(holding.realizedPnL);

      if (holding.currentValue !== null && totalCurrentValue !== null) {
        totalCurrentValue = totalCurrentValue.plus(holding.currentValue);
      } else if (holding.quantity.gt(0)) {
        totalCurrentValue = null; // Missing price data for some holdings
      }

      if (holding.unrealizedPnL !== null && totalUnrealizedPnL !== null) {
        totalUnrealizedPnL = totalUnrealizedPnL.plus(holding.unrealizedPnL);
      } else if (holding.quantity.gt(0)) {
        totalUnrealizedPnL = null;
      }

      // Group by asset type
      if (!byAssetType[holding.type]) {
        byAssetType[holding.type] = {
          invested: new Decimal(0),
          currentValue: new Decimal(0),
          count: 0,
        };
      }
      byAssetType[holding.type].invested = byAssetType[holding.type].invested.plus(holding.totalInvested);
      if (holding.currentValue !== null && byAssetType[holding.type].currentValue !== null) {
        byAssetType[holding.type].currentValue = (byAssetType[holding.type].currentValue as Decimal).plus(holding.currentValue);
      } else {
        byAssetType[holding.type].currentValue = null;
      }
      byAssetType[holding.type].count++;
    }

    const summary = {
      totalInvested,
      totalCurrentValue,
      totalUnrealizedPnL,
      totalRealizedPnL,
      holdings,
      byAssetType,
    };

    await this.evaluateGoals(userId, holdings);

    return summary;
  }

  async getPriceHistory(
    userId: string,
    assetIds: string[] | undefined,
    range?: string,
  ): Promise<PriceHistoryResponse> {
    let ids = assetIds?.filter(Boolean) ?? [];
    if (ids.length === 0) {
      const distinctAssets = await this.prisma.investmentOperation.findMany({
        where: { userId, deletedAt: null },
        select: { assetId: true },
        distinct: ['assetId'],
      });
      ids = distinctAssets.map((row) => row.assetId);
    }

    if (ids.length === 0) {
      return { range: range || '1Y', assets: [] };
    }

    const assets = await this.prisma.asset.findMany({
      where: { id: { in: ids } },
    });

    const results: PriceHistoryResponse['assets'] = [];

    for (const asset of assets) {
      const points = await this.marketPriceService.fetchPriceHistory(
        asset.symbol,
        asset.type,
        range,
      );
      results.push({
        assetId: asset.id,
        symbol: asset.symbol,
        currency: asset.currency,
        points,
      });
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    return { range: range || '1Y', assets: results };
  }

  async getGoals(userId: string) {
    let goals;

    try {
      goals = await this.prisma.investmentGoal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      if (this.isMissingGoalsTable(error)) {
        return [];
      }
      throw error;
    }

    if (goals.length === 0) {
      return [];
    }

    const goalAssetIds = Array.from(
      new Set(goals.map((goal) => goal.assetId).filter((id): id is string => !!id)),
    );
    const goalAssets = goalAssetIds.length
      ? await this.prisma.asset.findMany({
          where: { id: { in: goalAssetIds } },
        })
      : [];
    const goalAssetMap = new Map(goalAssets.map((asset) => [asset.id, asset]));
    const goalsWithAssets = goals.map((goal) => ({
      ...goal,
      asset: goal.assetId ? goalAssetMap.get(goal.assetId) ?? null : null,
    }));

    const holdings = await this.getHoldings(userId);
    const progress = await this.calculateGoalsProgress(goalsWithAssets, holdings);
    return progress;
  }

  async createGoal(userId: string, dto: {
    name: string;
    scope: 'PORTFOLIO' | 'ASSET';
    assetId?: string;
    targetAmount: number;
    currency?: string;
    targetDate?: string;
    alertAt80?: boolean;
    alertAt100?: boolean;
  }) {
    if (dto.scope === 'ASSET' && !dto.assetId) {
      throw new BadRequestException('assetId es requerido para objetivos por activo');
    }

    if (dto.assetId) {
      await this.prisma.asset.findUniqueOrThrow({ where: { id: dto.assetId } });
    }

    return this.prisma.investmentGoal.create({
      data: {
        userId,
        name: dto.name,
        scope: dto.scope,
        assetId: dto.assetId || null,
        targetAmount: dto.targetAmount,
        currency: dto.currency || 'USD',
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        alertAt80: dto.alertAt80 ?? true,
        alertAt100: dto.alertAt100 ?? true,
      },
      include: { asset: true },
    });
  }

  async updateGoal(
    userId: string,
    id: string,
    dto: {
      name?: string;
      scope?: 'PORTFOLIO' | 'ASSET';
      assetId?: string | null;
      targetAmount?: number;
      currency?: string;
      targetDate?: string | null;
      alertAt80?: boolean;
      alertAt100?: boolean;
    },
  ) {
    const existing = await this.prisma.investmentGoal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException(`Objetivo ${id} no encontrado`);
    }

    if (dto.scope === 'ASSET' && !dto.assetId) {
      throw new BadRequestException('assetId es requerido para objetivos por activo');
    }

    const shouldReset = dto.targetAmount !== undefined || dto.scope !== undefined || dto.assetId !== undefined || dto.currency !== undefined;

    return this.prisma.investmentGoal.update({
      where: { id },
      data: {
        name: dto.name,
        scope: dto.scope,
        assetId: dto.assetId === undefined ? undefined : dto.assetId,
        targetAmount: dto.targetAmount,
        currency: dto.currency,
        targetDate: dto.targetDate === undefined ? undefined : dto.targetDate ? new Date(dto.targetDate) : null,
        alertAt80: dto.alertAt80,
        alertAt100: dto.alertAt100,
        alert80Sent: shouldReset ? false : undefined,
        alert100Sent: shouldReset ? false : undefined,
        achievedAt: shouldReset ? null : undefined,
      },
      include: { asset: true },
    });
  }

  async removeGoal(userId: string, id: string) {
    const existing = await this.prisma.investmentGoal.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Objetivo ${id} no encontrado`);
    }
    return this.prisma.investmentGoal.delete({ where: { id } });
  }

  private async calculateGoalsProgress(
    goals: Array<{
      id: string;
      name: string;
      scope: 'PORTFOLIO' | 'ASSET';
      assetId: string | null;
      targetAmount: Decimal;
      currency: string;
      alertAt80: boolean;
      alertAt100: boolean;
      alert80Sent: boolean;
      alert100Sent: boolean;
      achievedAt: Date | null;
      asset?: { name: string; symbol: string } | null;
    }>,
    holdings: HoldingSummary[],
  ) {
    const holdingMap = new Map<string, { value: Decimal; currency: string }>();
    holdings.forEach((holding) => {
      const value = holding.currentValue ? new Decimal(holding.currentValue) : new Decimal(holding.totalInvested);
      holdingMap.set(holding.assetId, { value, currency: holding.currency });
    });

    const rateCache = new Map<string, Decimal | null>();
    const convertAmount = async (amount: Decimal, from?: string | null, to?: string | null) => {
      if (!from || !to) return null;
      if (from === to) return amount;
      const key = `${from}-${to}`;
      if (rateCache.has(key)) {
        const cached = rateCache.get(key);
        return cached ? amount.mul(cached) : null;
      }
      const rate = await this.exchangeRatesService.getRate(from, to);
      if (rate === null) {
        rateCache.set(key, null);
        return null;
      }
      const decimalRate = new Decimal(rate);
      rateCache.set(key, decimalRate);
      return amount.mul(decimalRate);
    };

    const result = [];

    for (const goal of goals) {
      let current: Decimal | null = null;

      const goalCurrency = goal.currency || 'USD';

      if (goal.scope === 'PORTFOLIO') {
        let total = new Decimal(0);
        let hasMissing = false;
        for (const holding of holdings) {
          const value = holding.currentValue ? new Decimal(holding.currentValue) : new Decimal(holding.totalInvested);
          const holdingCurrency = holding.currency || goalCurrency;
          const converted = await convertAmount(value, holdingCurrency, goalCurrency);
          if (!converted) {
            hasMissing = true;
            break;
          }
          total = total.plus(converted);
        }
        current = hasMissing ? null : total;
      } else if (goal.assetId) {
        const holding = holdingMap.get(goal.assetId);
        if (holding) {
          const holdingCurrency = holding.currency || goalCurrency;
          const converted = await convertAmount(holding.value, holdingCurrency, goalCurrency);
          current = converted ?? null;
        }
      }

      let target = new Decimal(0);
      try {
        target = new Decimal(goal.targetAmount ?? 0);
      } catch {
        target = new Decimal(0);
      }
      const progress = current && target.gt(0) ? current.div(target).mul(100) : null;

      result.push({
        ...goal,
        currentAmount: current ? current.toNumber() : null,
        progressPercent: progress ? Math.min(progress.toNumber(), 1000) : null,
      });
    }

    return result;
  }

  private async evaluateGoals(userId: string, holdings: HoldingSummary[]) {
    let goals;

    try {
      goals = await this.prisma.investmentGoal.findMany({
        where: { userId },
      });
    } catch (error) {
      if (this.isMissingGoalsTable(error)) {
        return;
      }
      throw error;
    }

    if (goals.length === 0) return;

    const progress = await this.calculateGoalsProgress(goals, holdings);

    for (const goal of progress) {
      if (goal.currentAmount === null || goal.progressPercent === null) continue;

      const percent = goal.progressPercent;
      const updates: Record<string, unknown> = {};

      if (goal.alertAt80 && !goal.alert80Sent && percent >= 80) {
        await this.prisma.notification.create({
          data: {
            userId,
            type: NotificationType.INFO,
            title: `Objetivo cerca: ${goal.name}`,
            message: `Has alcanzado el ${percent.toFixed(0)}% de tu objetivo.`,
            payload: { goalId: goal.id, progress: percent },
          },
        });
        updates.alert80Sent = true;
      }

      if (goal.alertAt100 && !goal.alert100Sent && percent >= 100) {
        await this.prisma.notification.create({
          data: {
            userId,
            type: NotificationType.INFO,
            title: `Objetivo alcanzado: ${goal.name}`,
            message: `Has alcanzado tu meta de inversión.`,
            payload: { goalId: goal.id, progress: percent },
          },
        });
        updates.alert100Sent = true;
      }

      if (percent >= 100 && !goal.achievedAt) {
        updates.achievedAt = new Date();
      }

      if (Object.keys(updates).length > 0) {
        await this.prisma.investmentGoal.update({
          where: { id: goal.id },
          data: updates,
        });
      }
    }
  }
}
