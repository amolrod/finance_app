import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExchangeRatesService, SUPPORTED_CURRENCIES } from './exchange-rates.service';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
@SkipThrottle()
export class ExchangeRatesController {
  constructor(private readonly exchangeRatesService: ExchangeRatesService) {}

  /**
   * Obtiene las monedas soportadas
   */
  @Get('currencies')
  getSupportedCurrencies() {
    return {
      success: true,
      data: {
        currencies: SUPPORTED_CURRENCIES,
      },
    };
  }

  /**
   * Obtiene el tipo de cambio entre dos monedas
   */
  @Get('rate')
  async getRate(
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) {
      return {
        success: false,
        error: 'Both "from" and "to" currencies are required',
      };
    }

    const rate = await this.exchangeRatesService.getRate(from, to);
    
    if (rate === null) {
      return {
        success: false,
        error: `Could not get exchange rate for ${from} -> ${to}`,
      };
    }

    return {
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        fetchedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Convierte una cantidad de una moneda a otra
   */
  @Get('convert')
  async convert(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!amount || !from || !to) {
      return {
        success: false,
        error: 'Parameters "amount", "from", and "to" are required',
      };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return {
        success: false,
        error: 'Invalid amount',
      };
    }

    const result = await this.exchangeRatesService.convert(numAmount, from, to);
    
    if (result === null) {
      return {
        success: false,
        error: `Could not convert ${from} to ${to}`,
      };
    }

    const rate = await this.exchangeRatesService.getRate(from, to);

    return {
      success: true,
      data: {
        originalAmount: numAmount,
        originalCurrency: from.toUpperCase(),
        convertedAmount: result,
        targetCurrency: to.toUpperCase(),
        rate,
      },
    };
  }

  /**
   * Obtiene todos los tipos de cambio para una moneda base
   */
  @Get('all')
  async getAllRates(@Query('base') base: string = 'USD') {
    const rates = await this.exchangeRatesService.getAllRatesForBase(base);
    
    return {
      success: true,
      data: {
        baseCurrency: base.toUpperCase(),
        rates: rates.map(r => ({
          currency: r.targetCurrency,
          rate: r.rate,
          source: r.source,
          fetchedAt: r.fetchedAt.toISOString(),
        })),
      },
    };
  }

  /**
   * Obtiene el historial de tipos de cambio
   */
  @Get('history')
  async getHistory(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('days') days: string = '30',
  ) {
    if (!from || !to) {
      return {
        success: false,
        error: 'Both "from" and "to" currencies are required',
      };
    }

    const numDays = parseInt(days, 10);
    if (isNaN(numDays) || numDays < 1 || numDays > 365) {
      return {
        success: false,
        error: 'Days must be between 1 and 365',
      };
    }

    const history = await this.exchangeRatesService.getRateHistory(from, to, numDays);

    return {
      success: true,
      data: {
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        days: numDays,
        history: history.map(h => ({
          date: h.date.toISOString(),
          rate: h.rate,
        })),
      },
    };
  }

  /**
   * Fuerza una actualización de los tipos de cambio
   */
  @Get('refresh')
  async refresh() {
    await this.exchangeRatesService.refreshAllRates();
    
    return {
      success: true,
      message: 'Exchange rates refreshed successfully',
    };
  }
}
