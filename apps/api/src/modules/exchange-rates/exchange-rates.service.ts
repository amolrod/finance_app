import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { firstValueFrom } from 'rxjs';

// Monedas principales que soportamos
export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'MXN', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'BRL', 'ARS', 'COP', 'CLP', 'PEN'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Respuesta de Frankfurter API
interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface ExchangeRateResult {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  source: string;
  fetchedAt: Date;
}

@Injectable()
export class ExchangeRatesService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeRatesService.name);
  private readonly FRANKFURTER_BASE_URL = 'https://api.frankfurter.app';
  private readonly CACHE_DURATION_HOURS = 1; // Cache rates for 1 hour

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Inicializar tipos de cambio al arrancar
    this.logger.log('Initializing exchange rates...');
    await this.refreshAllRates();
  }

  /**
   * Obtiene el tipo de cambio más reciente de la base de datos
   */
  async getRate(baseCurrency: string, targetCurrency: string): Promise<number | null> {
    const base = baseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();

    // Si son la misma moneda, el tipo es 1
    if (base === target) {
      return 1;
    }

    // Buscar en cache (base de datos)
    const cached = await this.prisma.exchangeRate.findFirst({
      where: {
        baseCurrency: base,
        targetCurrency: target,
        fetchedAt: {
          gte: new Date(Date.now() - this.CACHE_DURATION_HOURS * 60 * 60 * 1000),
        },
      },
      orderBy: { fetchedAt: 'desc' },
    });

    if (cached) {
      return Number(cached.rate);
    }

    // Si no hay cache válido, obtener de API
    const freshRate = await this.fetchRateFromApi(base, target);
    if (freshRate) {
      await this.saveRate(freshRate);
      return freshRate.rate;
    }

    // Intentar usar el último rate conocido (aunque esté expirado)
    const lastKnown = await this.prisma.exchangeRate.findFirst({
      where: {
        baseCurrency: base,
        targetCurrency: target,
      },
      orderBy: { fetchedAt: 'desc' },
    });

    return lastKnown ? Number(lastKnown.rate) : null;
  }

  /**
   * Convierte una cantidad de una moneda a otra
   */
  async convert(amount: number, fromCurrency: string, toCurrency: string): Promise<number | null> {
    const rate = await this.getRate(fromCurrency, toCurrency);
    if (rate === null) {
      return null;
    }
    return amount * rate;
  }

  /**
   * Obtiene todos los tipos de cambio actuales para una moneda base
   */
  async getAllRatesForBase(baseCurrency: string): Promise<ExchangeRateResult[]> {
    const base = baseCurrency.toUpperCase();
    
    const rates = await this.prisma.exchangeRate.findMany({
      where: {
        baseCurrency: base,
        fetchedAt: {
          gte: new Date(Date.now() - this.CACHE_DURATION_HOURS * 60 * 60 * 1000),
        },
      },
      orderBy: { targetCurrency: 'asc' },
      distinct: ['targetCurrency'],
    });

    return rates.map(r => ({
      baseCurrency: r.baseCurrency,
      targetCurrency: r.targetCurrency,
      rate: Number(r.rate),
      source: r.source,
      fetchedAt: r.fetchedAt,
    }));
  }

  /**
   * Obtiene el historial de tipos de cambio
   */
  async getRateHistory(
    baseCurrency: string,
    targetCurrency: string,
    days: number = 30,
  ): Promise<{ date: Date; rate: number }[]> {
    const base = baseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await this.prisma.exchangeRate.findMany({
      where: {
        baseCurrency: base,
        targetCurrency: target,
        fetchedAt: { gte: startDate },
      },
      orderBy: { fetchedAt: 'asc' },
      select: {
        fetchedAt: true,
        rate: true,
      },
    });

    return history.map(h => ({
      date: h.fetchedAt,
      rate: Number(h.rate),
    }));
  }

  /**
   * Obtiene tipo de cambio de la API de Frankfurter
   */
  private async fetchRateFromApi(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<ExchangeRateResult | null> {
    try {
      const url = `${this.FRANKFURTER_BASE_URL}/latest?from=${baseCurrency}&to=${targetCurrency}`;
      const response = await firstValueFrom(
        this.httpService.get<FrankfurterResponse>(url),
      );

      const rate = response.data.rates[targetCurrency];
      if (!rate) {
        this.logger.warn(`No rate found for ${baseCurrency} -> ${targetCurrency}`);
        return null;
      }

      return {
        baseCurrency,
        targetCurrency,
        rate,
        source: 'frankfurter',
        fetchedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch rate for ${baseCurrency} -> ${targetCurrency}:`, error);
      return null;
    }
  }

  /**
   * Obtiene todos los tipos de cambio para una moneda base desde la API
   */
  private async fetchAllRatesFromApi(baseCurrency: string): Promise<ExchangeRateResult[]> {
    try {
      const targets = SUPPORTED_CURRENCIES.filter(c => c !== baseCurrency);
      const url = `${this.FRANKFURTER_BASE_URL}/latest?from=${baseCurrency}&to=${targets.join(',')}`;
      
      const response = await firstValueFrom(
        this.httpService.get<FrankfurterResponse>(url),
      );

      const now = new Date();
      const results: ExchangeRateResult[] = [];

      for (const [currency, rateValue] of Object.entries(response.data.rates)) {
        results.push({
          baseCurrency,
          targetCurrency: currency,
          rate: rateValue as number,
          source: 'frankfurter',
          fetchedAt: now,
        });
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to fetch all rates for ${baseCurrency}:`, error);
      return [];
    }
  }

  /**
   * Guarda un tipo de cambio en la base de datos
   */
  private async saveRate(rate: ExchangeRateResult): Promise<void> {
    try {
      await this.prisma.exchangeRate.create({
        data: {
          baseCurrency: rate.baseCurrency,
          targetCurrency: rate.targetCurrency,
          rate: new Decimal(rate.rate),
          source: rate.source,
          fetchedAt: rate.fetchedAt,
        },
      });
    } catch (error) {
      // Ignorar errores de duplicados
      if (!(error instanceof Error && error.message.includes('Unique constraint'))) {
        this.logger.error('Failed to save exchange rate:', error);
      }
    }
  }

  /**
   * Actualiza todos los tipos de cambio principales
   */
  async refreshAllRates(): Promise<void> {
    this.logger.log('Refreshing all exchange rates...');
    
    // Obtener tipos de cambio con USD como base (la más común)
    const usdRates = await this.fetchAllRatesFromApi('USD');
    for (const rate of usdRates) {
      await this.saveRate(rate);
    }

    // También EUR como base (segunda más común)
    const eurRates = await this.fetchAllRatesFromApi('EUR');
    for (const rate of eurRates) {
      await this.saveRate(rate);
    }

    this.logger.log(`Refreshed ${usdRates.length + eurRates.length} exchange rates`);
  }

  /**
   * Cron job para actualizar tipos de cambio cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCronRefresh() {
    this.logger.log('Running scheduled exchange rate refresh...');
    await this.refreshAllRates();
  }

  /**
   * Obtiene todas las monedas soportadas
   */
  getSupportedCurrencies(): string[] {
    return [...SUPPORTED_CURRENCIES];
  }

  /**
   * Limpia tipos de cambio antiguos (más de 30 días)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldRates(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await this.prisma.exchangeRate.deleteMany({
      where: {
        fetchedAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`Cleaned up ${result.count} old exchange rates`);
  }
}
