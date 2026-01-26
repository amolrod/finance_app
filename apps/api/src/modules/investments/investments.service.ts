import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExchangeRatesService } from '../exchange-rates/exchange-rates.service';
import {
  CreateInvestmentOperationDto,
  UpdateInvestmentOperationDto,
  InvestmentOperationQueryDto,
} from './dto';
import { Prisma, OperationType } from '@prisma/client';
import Decimal from 'decimal.js';

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
  ) {}

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
        occurredAt: new Date(dto.occurredAt),
        notes: dto.notes,
      },
      include: {
        asset: true,
      },
    });
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

    // Recalculate total if quantity or price changed
    let totalAmount = operation.totalAmount;
    if (dto.quantity !== undefined || dto.pricePerUnit !== undefined) {
      const quantity = new Decimal(dto.quantity ?? operation.quantity.toString());
      const pricePerUnit = new Decimal(dto.pricePerUnit ?? operation.pricePerUnit.toString());
      const fees = new Decimal(dto.fees ?? operation.fees.toString());
      const type = dto.type ?? operation.type;

      totalAmount = quantity.mul(pricePerUnit);
      if (type === OperationType.BUY) {
        totalAmount = totalAmount.plus(fees);
      } else if (type === OperationType.SELL) {
        totalAmount = totalAmount.minus(fees);
      }
    }

    return this.prisma.investmentOperation.update({
      where: { id },
      data: {
        ...dto,
        totalAmount: totalAmount.toNumber(),
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
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
      include: { asset: { include: { prices: { take: 1, orderBy: { fetchedAt: 'desc' } } } } },
      orderBy: { occurredAt: 'asc' },
    });

    // Group operations by asset
    const holdingsMap = new Map<string, {
      asset: typeof operations[0]['asset'];
      operations: typeof operations;
    }>();

    for (const op of operations) {
      const existing = holdingsMap.get(op.assetId);
      if (existing) {
        existing.operations.push(op);
      } else {
        holdingsMap.set(op.assetId, {
          asset: op.asset,
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

        switch (op.type) {
          case OperationType.BUY:
            lots.push({ quantity: opQty, costPerUnit: opPrice.plus(opFees.div(opQty)) });
            quantity = quantity.plus(opQty);
            totalCost = totalCost.plus(opQty.mul(opPrice)).plus(opFees);
            break;

          case OperationType.SELL:
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
      const priceCurrencyRaw = latestPriceRecord?.currency || data.asset.currency;
      const isPence = priceCurrencyRaw === 'GBp' || priceCurrencyRaw === 'GBX';
      const priceCurrency = isPence ? 'GBP' : priceCurrencyRaw;
      const normalizedPrice = isPence && latestPrice ? latestPrice.div(100) : latestPrice;
      let effectivePrice: Decimal | null = normalizedPrice;

      let currentValue: Decimal | null = null;
      let unrealizedPnL: Decimal | null = null;
      let unrealizedPnLPercent: Decimal | null = null;

      if (normalizedPrice) {
        if (priceCurrency !== data.asset.currency) {
          const converted = await this.exchangeRatesService.convert(
            normalizedPrice.toNumber(),
            priceCurrency,
            data.asset.currency,
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
        currency: data.asset.currency,
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

    return {
      totalInvested,
      totalCurrentValue,
      totalUnrealizedPnL,
      totalRealizedPnL,
      holdings,
      byAssetType,
    };
  }
}
