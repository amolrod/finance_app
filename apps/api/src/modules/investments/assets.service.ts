import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto } from './dto';
import { AssetType, Prisma } from '@prisma/client';
import axios from 'axios';

type AssetSearchResult = {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
  currency?: string;
  source: string;
  assetId?: string;
};

const YAHOO_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';
const SUPPORTED_QUOTE_TYPES = new Map<string, AssetType>([
  ['EQUITY', AssetType.STOCK],
  ['ETF', AssetType.ETF],
  ['MUTUALFUND', AssetType.MUTUAL_FUND],
  ['CRYPTOCURRENCY', AssetType.CRYPTO],
  ['BOND', AssetType.BOND],
]);

const normalizeCryptoSymbol = (symbol: string) => {
  const upper = symbol.toUpperCase();
  if (upper.includes('-')) {
    return upper.split('-')[0];
  }
  return upper;
};

const normalizeCurrency = (currency?: string) => {
  if (!currency) return undefined;
  if (currency === 'GBp' || currency === 'GBX') return 'GBP';
  return currency.toUpperCase();
};

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAssetDto) {
    // Check if asset with same symbol and type already exists
    const existing = await this.prisma.asset.findUnique({
      where: {
        symbol_type: {
          symbol: dto.symbol.toUpperCase(),
          type: dto.type,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Asset ${dto.symbol} (${dto.type}) already exists`);
    }

    return this.prisma.asset.create({
      data: {
        symbol: dto.symbol.toUpperCase(),
        name: dto.name,
        type: dto.type,
        currency: dto.currency || 'USD',
        exchange: dto.exchange,
      },
    });
  }

  async findAll(query: AssetQueryDto) {
    const where: Prisma.AssetWhereInput = {};

    if (query.search) {
      where.OR = [
        { symbol: { contains: query.search.toUpperCase(), mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.type = query.type;
    }

    return this.prisma.asset.findMany({
      where,
      orderBy: { symbol: 'asc' },
      include: {
        prices: {
          take: 1,
          orderBy: { fetchedAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: {
        prices: {
          take: 10,
          orderBy: { fetchedAt: 'desc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async findBySymbol(symbol: string, type: AssetType) {
    return this.prisma.asset.findUnique({
      where: {
        symbol_type: {
          symbol: symbol.toUpperCase(),
          type,
        },
      },
    });
  }

  async update(id: string, dto: UpdateAssetDto) {
    await this.findOne(id); // Ensure exists

    return this.prisma.asset.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists

    // Check if there are operations using this asset
    const operationsCount = await this.prisma.investmentOperation.count({
      where: { assetId: id },
    });

    if (operationsCount > 0) {
      throw new ConflictException(
        `Cannot delete asset: ${operationsCount} operations reference this asset`
      );
    }

    return this.prisma.asset.delete({
      where: { id },
    });
  }

  /**
   * Get or create an asset by symbol
   */
  async getOrCreate(symbol: string, type: AssetType, name?: string) {
    const existing = await this.findBySymbol(symbol, type);
    if (existing) return existing;

    return this.create({
      symbol,
      type,
      name: name || symbol,
    });
  }

  async searchExternal(query: string): Promise<AssetSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const response = await axios.get(YAHOO_SEARCH_URL, {
      params: {
        q: trimmed,
        quotesCount: 12,
        newsCount: 0,
        listsCount: 0,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 8000,
    });

    const quotes = Array.isArray(response.data?.quotes) ? response.data.quotes : [];
    const results: AssetSearchResult[] = [];
    const seen = new Set<string>();

    for (const quote of quotes) {
      const quoteType = String(quote?.quoteType || '').toUpperCase();
      const type = SUPPORTED_QUOTE_TYPES.get(quoteType);
      if (!type) continue;

      let symbol = String(quote?.symbol || '').trim();
      if (!symbol) continue;

      if (type === AssetType.CRYPTO) {
        symbol = normalizeCryptoSymbol(symbol);
      }

      const name = String(quote?.longname || quote?.shortname || quote?.symbol || symbol).trim();
      const exchange = String(quote?.fullExchangeName || quote?.exchange || quote?.exchDisp || '').trim();
      const currency = normalizeCurrency(String(quote?.currency || '').trim()) || undefined;

      const key = `${symbol.toUpperCase()}-${type}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        symbol: symbol.toUpperCase(),
        name,
        type,
        exchange: exchange || undefined,
        currency: currency || undefined,
        source: 'yahoo',
      });
    }

    if (results.length === 0) return [];

    const existingAssets = await this.prisma.asset.findMany({
      where: {
        OR: results.map((result) => ({
          symbol: result.symbol,
          type: result.type,
        })),
      },
      select: { id: true, symbol: true, type: true },
    });

    const existingMap = new Map(
      existingAssets.map((asset) => [`${asset.symbol}-${asset.type}`, asset.id]),
    );

    return results.map((result) => ({
      ...result,
      assetId: existingMap.get(`${result.symbol}-${result.type}`),
    }));
  }
}
