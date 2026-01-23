import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAssetDto, UpdateAssetDto, AssetQueryDto } from './dto';
import { AssetType, Prisma } from '@prisma/client';

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
}
