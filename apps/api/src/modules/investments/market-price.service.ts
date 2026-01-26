import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

interface PriceData {
  symbol: string;
  price: number;
  currency: string;
  source: string;
  change24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketCap?: number;
}

// Mapeo de símbolos comunes de cripto a IDs de CoinGecko
const CRYPTO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'ADA': 'cardano',
  'XRP': 'ripple',
  'DOT': 'polkadot',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'APT': 'aptos',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'FIL': 'filecoin',
  'AAVE': 'aave',
  'MKR': 'maker',
  'CRV': 'curve-dao-token',
  'SNX': 'havven',
  'COMP': 'compound-governance-token',
  'SHIB': 'shiba-inu',
  'PEPE': 'pepe',
  'WIF': 'dogwifcoin',
  'BONK': 'bonk',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'DAI': 'dai',
};

@Injectable()
export class MarketPriceService {
  private readonly logger = new Logger(MarketPriceService.name);
  private priceCache: Map<string, { data: PriceData; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 1000; // 1 minuto

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Obtener precio de Yahoo Finance (acciones, ETFs)
   */
  private async fetchYahooFinancePrice(symbol: string): Promise<PriceData | null> {
    try {
      // Yahoo Finance API (no oficial pero funcional)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        this.logger.warn(`Yahoo Finance: No data for ${symbol}`);
        return null;
      }

      const meta = result.meta;
      const quote = result.indicators?.quote?.[0];
      
      const rawCurrency = meta.currency || 'USD';
      const isPence = rawCurrency === 'GBp' || rawCurrency === 'GBX';
      const currency = isPence ? 'GBP' : rawCurrency;
      const scale = isPence ? 0.01 : 1;

      const rawCurrent = meta.regularMarketPrice || meta.previousClose;
      if (rawCurrent === undefined || rawCurrent === null) {
        this.logger.warn(`Yahoo Finance: Missing price for ${symbol}`);
        return null;
      }

      const currentPrice = rawCurrent * scale;
      const previousClose = (meta.previousClose || rawCurrent) * scale;
      const change = currentPrice - previousClose;
      const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

      return {
        symbol: symbol.toUpperCase(),
        price: Math.round(currentPrice * 100) / 100,
        currency,
        source: 'yahoo-finance',
        change24h: Math.round(change * 100) / 100,
        changePercent24h: Math.round(changePercent * 100) / 100,
        high24h: quote?.high?.[0]
          ? Math.round(quote.high[0] * scale * 100) / 100
          : undefined,
        low24h: quote?.low?.[0]
          ? Math.round(quote.low[0] * scale * 100) / 100
          : undefined,
        volume24h: quote?.volume?.[0],
        marketCap: meta.marketCap,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.warn(`Yahoo Finance error for ${symbol}: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Obtener precio de CoinGecko (criptomonedas)
   */
  private async fetchCoinGeckoPrice(symbol: string): Promise<PriceData | null> {
    try {
      const coinId = CRYPTO_ID_MAP[symbol.toUpperCase()];
      if (!coinId) {
        this.logger.debug(`CoinGecko: Unknown crypto symbol ${symbol}`);
        return null;
      }

      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
      
      const response = await axios.get(url, {
        timeout: 10000,
      });

      const data = response.data[coinId];
      if (!data) {
        this.logger.warn(`CoinGecko: No data for ${symbol} (${coinId})`);
        return null;
      }

      const price = data.usd;
      const changePercent = data.usd_24h_change || 0;
      const change = price * (changePercent / 100);

      return {
        symbol: symbol.toUpperCase(),
        price: price,
        currency: 'USD',
        source: 'coingecko',
        change24h: Math.round(change * 100) / 100,
        changePercent24h: Math.round(changePercent * 100) / 100,
        volume24h: data.usd_24h_vol,
        marketCap: data.usd_market_cap,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.warn(`CoinGecko error for ${symbol}: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Fetch price for a single asset
   * Tries real APIs first, falls back to reference price
   */
  async fetchPrice(
    symbol: string,
    type: string,
    referencePrice?: number,
    referenceCurrency?: string,
  ): Promise<PriceData | null> {
    const upperSymbol = symbol.toUpperCase();
    
    // Check cache first
    const cached = this.priceCache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Using cached price for ${upperSymbol}`);
      return cached.data;
    }

    this.logger.debug(`Fetching real price for ${upperSymbol} (${type})`);

    let priceData: PriceData | null = null;

    // Try crypto API first for CRYPTO type
    if (type === 'CRYPTO') {
      priceData = await this.fetchCoinGeckoPrice(upperSymbol);
    }

    // If not crypto or crypto fetch failed, try Yahoo Finance
    if (!priceData && type !== 'CRYPTO') {
      priceData = await this.fetchYahooFinancePrice(upperSymbol);
    }

    // If Yahoo failed for ETF, try with common suffixes
    if (!priceData && type === 'ETF') {
      // Some ETFs might need different formatting
      priceData = await this.fetchYahooFinancePrice(upperSymbol);
    }

    // Fallback: use reference price with simulated variation
    if (!priceData && referencePrice && referencePrice > 0) {
      this.logger.debug(`Using reference price for ${upperSymbol}`);
      const rawCurrency = referenceCurrency || 'USD';
      const isPence = rawCurrency === 'GBp' || rawCurrency === 'GBX';
      const currency = isPence ? 'GBP' : rawCurrency;
      const scale = isPence ? 0.01 : 1;
      const variation = 1 + (Math.random() - 0.5) * 0.02; // ±1%
      priceData = {
        symbol: upperSymbol,
        price: Math.round(referencePrice * scale * variation * 100) / 100,
        currency,
        source: 'reference-estimate',
      };
    }

    // Cache the result
    if (priceData) {
      this.priceCache.set(upperSymbol, { data: priceData, timestamp: Date.now() });
    }

    return priceData;
  }

  /**
   * Save price to database
   */
  async savePrice(assetId: string, priceData: PriceData) {
    return this.prisma.marketPrice.create({
      data: {
        assetId,
        price: priceData.price,
        currency: priceData.currency,
        source: priceData.source,
        fetchedAt: new Date(),
      },
    });
  }

  /**
   * Get latest price for an asset
   */
  async getLatestPrice(assetId: string) {
    return this.prisma.marketPrice.findFirst({
      where: { assetId },
      orderBy: { fetchedAt: 'desc' },
    });
  }

  /**
   * Get price history for an asset
   */
  async getPriceHistory(assetId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.marketPrice.findMany({
      where: {
        assetId,
        fetchedAt: { gte: startDate },
      },
      orderBy: { fetchedAt: 'asc' },
    });
  }

  /**
   * Update prices for all assets (called by cron job)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async updateAllPrices() {
    // Run in all environments for real-time prices
    this.logger.log('Starting automatic price update for all assets');

    const assets = await this.prisma.asset.findMany({
      include: {
        operations: {
          where: { type: 'BUY', deletedAt: null },
          select: { pricePerUnit: true, quantity: true },
        },
      },
    });
    
    let updated = 0;
    let failed = 0;

    for (const asset of assets) {
      try {
        // Calculate reference price
        let referencePrice: number | undefined;
        if (asset.operations.length > 0) {
          const totalValue = asset.operations.reduce(
            (sum, op) => sum + parseFloat(op.pricePerUnit.toString()) * parseFloat(op.quantity.toString()),
            0
          );
          const totalQty = asset.operations.reduce(
            (sum, op) => sum + parseFloat(op.quantity.toString()),
            0
          );
          if (totalQty > 0) referencePrice = totalValue / totalQty;
        }

        const priceData = await this.fetchPrice(
          asset.symbol,
          asset.type,
          referencePrice,
          asset.currency,
        );
        if (priceData) {
          await this.savePrice(asset.id, priceData);
          updated++;
          this.logger.debug(`Updated ${asset.symbol}: $${priceData.price} (${priceData.source})`);
        }
      } catch (error) {
        this.logger.error(`Failed to update price for ${asset.symbol}:`, error);
        failed++;
      }

      // Rate limiting - 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.logger.log(`Price update completed: ${updated} updated, ${failed} failed`);
  }

  /**
   * Manually trigger price update for specific assets
   */
  async refreshPrices(assetIds: string[]) {
    const assets = await this.prisma.asset.findMany({
      where: { id: { in: assetIds } },
      include: {
        operations: {
          where: { type: 'BUY', deletedAt: null },
          select: { pricePerUnit: true, quantity: true },
        },
      },
    });

    const results: { 
      assetId: string; 
      symbol: string; 
      success: boolean; 
      price?: number; 
      source?: string;
      change24h?: number;
      changePercent24h?: number;
      error?: string;
    }[] = [];

    for (const asset of assets) {
      try {
        // Calculate reference price
        let referencePrice: number | undefined;
        if (asset.operations.length > 0) {
          const totalValue = asset.operations.reduce(
            (sum, op) => sum + parseFloat(op.pricePerUnit.toString()) * parseFloat(op.quantity.toString()),
            0
          );
          const totalQty = asset.operations.reduce(
            (sum, op) => sum + parseFloat(op.quantity.toString()),
            0
          );
          if (totalQty > 0) referencePrice = totalValue / totalQty;
        }

        const priceData = await this.fetchPrice(
          asset.symbol,
          asset.type,
          referencePrice,
          asset.currency,
        );
        
        if (priceData) {
          await this.savePrice(asset.id, priceData);
          results.push({
            assetId: asset.id,
            symbol: asset.symbol,
            success: true,
            price: priceData.price,
            source: priceData.source,
            change24h: priceData.change24h,
            changePercent24h: priceData.changePercent24h,
          });
        } else {
          results.push({
            assetId: asset.id,
            symbol: asset.symbol,
            success: false,
            error: 'No price data available',
          });
        }
      } catch (error) {
        this.logger.error(`Error refreshing price for ${asset.symbol}:`, error);
        results.push({
          assetId: asset.id,
          symbol: asset.symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Search for a symbol (useful for autocomplete)
   */
  async searchSymbol(query: string): Promise<{ symbol: string; name: string; type: string; exchange?: string }[]> {
    try {
      const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 5000,
      });

      const quotes = response.data?.quotes || [];
      
      return quotes.map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: this.mapYahooType(q.quoteType),
        exchange: q.exchange,
      }));
    } catch (error) {
      this.logger.error('Symbol search error:', error);
      return [];
    }
  }

  private mapYahooType(yahooType: string): string {
    const typeMap: Record<string, string> = {
      'EQUITY': 'STOCK',
      'ETF': 'ETF',
      'MUTUALFUND': 'MUTUAL_FUND',
      'CRYPTOCURRENCY': 'CRYPTO',
      'FUTURE': 'OTHER',
      'INDEX': 'OTHER',
    };
    return typeMap[yahooType] || 'OTHER';
  }

  /**
   * Get quotes for multiple symbols at once (batch)
   */
  async getBatchQuotes(symbols: string[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    
    // Separate crypto and stocks
    const cryptoSymbols = symbols.filter(s => CRYPTO_ID_MAP[s.toUpperCase()]);
    const stockSymbols = symbols.filter(s => !CRYPTO_ID_MAP[s.toUpperCase()]);

    // Batch crypto prices from CoinGecko
    if (cryptoSymbols.length > 0) {
      try {
        const coinIds = cryptoSymbols.map(s => CRYPTO_ID_MAP[s.toUpperCase()]).join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`;
        
        const response = await axios.get(url, { timeout: 10000 });
        
        for (const symbol of cryptoSymbols) {
          const coinId = CRYPTO_ID_MAP[symbol.toUpperCase()];
          const data = response.data[coinId];
          if (data) {
            results.set(symbol.toUpperCase(), {
              symbol: symbol.toUpperCase(),
              price: data.usd,
              currency: 'USD',
              source: 'coingecko',
              changePercent24h: data.usd_24h_change,
            });
          }
        }
      } catch (error) {
        this.logger.warn('Batch crypto fetch failed:', error);
      }
    }

    // Fetch stock prices individually (Yahoo doesn't have a good batch endpoint)
    for (const symbol of stockSymbols) {
      const price = await this.fetchYahooFinancePrice(symbol);
      if (price) {
        results.set(symbol.toUpperCase(), price);
      }
    }

    return results;
  }
}
