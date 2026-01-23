# ADR-004: Estrategia de Cache de Precios de Mercado

## Estado
**Aceptado** - 2026-01-09

## Contexto
Para el módulo de inversiones (Fase 4), necesitamos precios de mercado actualizados
para calcular valor de portfolio y PnL. Las APIs externas tienen rate limits y
latencia que debemos manejar inteligentemente.

## Decisión

### Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRICE FETCH STRATEGY                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────┐     ┌─────────┐     ┌─────────────────┐         │
│    │ Request │────>│  Redis  │────>│ Return cached   │         │
│    │ Price   │     │  Cache  │     │ if < 5 min old  │         │
│    └─────────┘     └────┬────┘     └─────────────────┘         │
│                         │ MISS                                   │
│                         ▼                                        │
│                  ┌──────────────┐                                │
│                  │ External API │                                │
│                  │  (fallback)  │                                │
│                  └──────┬───────┘                                │
│                         │                                        │
│         ┌───────────────┼───────────────┐                       │
│         ▼               ▼               ▼                       │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐                   │
│   │CoinGecko │   │ Finnhub  │   │TwelveData│                   │
│   │ (crypto) │   │ (stocks) │   │(fallback)│                   │
│   └──────────┘   └──────────┘   └──────────┘                   │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────┐                                │
│              │  Store in DB &  │                                │
│              │  Update Redis   │                                │
│              └─────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### APIs Seleccionadas

| Asset Type | Primary API | Fallback | Rate Limit |
|------------|-------------|----------|------------|
| Crypto | CoinGecko | - | 30/min (free) |
| Stocks/ETFs | Finnhub | Twelve Data | 60/min (free) |

**Justificación Finnhub sobre Twelve Data:**
- Mayor rate limit en tier gratuito
- Mejor cobertura de mercados europeos
- WebSocket disponible para upgrades

### Estrategia de Cache

```typescript
interface PriceCache {
  symbol: string;
  price: string;        // Decimal string
  currency: string;
  source: string;
  fetchedAt: Date;
  expiresAt: Date;
}
```

#### TTL por Tipo de Asset
| Asset Type | Cache TTL | Justificación |
|------------|-----------|---------------|
| Crypto | 2 minutos | Alta volatilidad |
| Stocks (market hours) | 5 minutos | Cambios frecuentes |
| Stocks (after hours) | 30 minutos | Sin cambios |
| ETFs | 5 minutos | Similar a stocks |

#### Redis Keys
```
price:{type}:{symbol}  → PriceCache JSON
prices:batch:{date}    → Batch de todos los precios del día
```

### Scheduled Jobs (BullMQ)

```typescript
// jobs/price-refresh.job.ts
@Processor('prices')
export class PriceRefreshProcessor {
  @Process('refresh-all')
  async refreshAll() {
    // 1. Get all unique symbols from user portfolios
    // 2. Batch fetch from APIs
    // 3. Update DB + Redis
    // 4. Notify websocket clients
  }
}

// Cron: cada 5 minutos en horario de mercado
// Cron: cada 30 minutos fuera de horario
```

### Fallback Strategy

```typescript
async getPrice(symbol: string, type: AssetType): Promise<Price> {
  // 1. Check Redis
  const cached = await redis.get(`price:${type}:${symbol}`);
  if (cached && !isExpired(cached)) {
    return JSON.parse(cached);
  }

  // 2. Try primary API
  try {
    const price = await this.fetchFromPrimary(symbol, type);
    await this.cachePrice(symbol, type, price);
    return price;
  } catch (error) {
    // 3. Try fallback API
    try {
      const price = await this.fetchFromFallback(symbol, type);
      await this.cachePrice(symbol, type, price);
      return price;
    } catch {
      // 4. Return last known price from DB
      return this.getLastKnownPrice(symbol);
    }
  }
}
```

### Database Storage

```prisma
model MarketPrice {
  id        String   @id @default(uuid())
  assetId   String
  price     Decimal  @db.Decimal(18, 6)
  currency  String
  source    String   // "coingecko", "finnhub", "fallback"
  fetchedAt DateTime
  
  asset     Asset    @relation(fields: [assetId])
  
  @@index([assetId, fetchedAt])
}
```

### Rate Limit Protection

```typescript
// Redis-based rate limiter
const RATE_LIMITS = {
  coingecko: { requests: 30, window: 60 },
  finnhub: { requests: 60, window: 60 },
};

async checkRateLimit(api: string): Promise<boolean> {
  const key = `ratelimit:${api}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, RATE_LIMITS[api].window);
  }
  
  return current <= RATE_LIMITS[api].requests;
}
```

## Consecuencias

### Positivas
- Precios siempre disponibles (fallback a DB)
- Rate limits respetados
- Latencia baja para usuarios
- Escalable con más providers

### Negativas
- Precios pueden estar desactualizados hasta 5 min
- Complejidad en manejo de errores
- Storage crece con histórico de precios

## Métricas a Monitorear
- Cache hit ratio
- API error rates
- Price staleness (tiempo desde último update)
- Rate limit proximity

## Referencias
- [CoinGecko API](https://www.coingecko.com/api/documentation)
- [Finnhub API](https://finnhub.io/docs/api)
- [Twelve Data API](https://twelvedata.com/docs)
