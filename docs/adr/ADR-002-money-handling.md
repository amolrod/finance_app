# ADR-002: Manejo de Dinero (Decimal.js + NUMERIC)

## Estado
**Aceptado** - 2026-01-09

## Contexto
Las aplicaciones financieras requieren precisión absoluta en cálculos monetarios.
Los tipos `float` y `double` tienen errores de representación binaria que causan
discrepancias inaceptables en finanzas (ej: `0.1 + 0.2 !== 0.3`).

## Decisión

### Base de Datos
Usar `NUMERIC(18,2)` de PostgreSQL para monedas fiat:
- 18 dígitos totales
- 2 decimales (centavos)
- Rango: ±9,999,999,999,999,999.99

Para criptomonedas usar `NUMERIC(18,8)`:
- 8 decimales para satoshis/wei equivalentes

### Runtime (TypeScript)
Usar **Decimal.js** para todas las operaciones:

```typescript
import Decimal from 'decimal.js';

// Configuración global
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

// Operaciones
const price = new Decimal('99.99');
const quantity = new Decimal('3');
const total = price.times(quantity); // 299.97

// Comparaciones
if (total.greaterThan('250')) { ... }

// Output
const formatted = total.toFixed(2); // "299.97"
```

### API
- Recibir y enviar valores monetarios como **strings**
- Validar formato con regex: `/^\d+(\.\d{1,2})?$/`
- Documentar en OpenAPI como `string` con `format: decimal`

### Conversiones
```typescript
// Prisma Decimal → Decimal.js
const amount = new Decimal(transaction.amount.toString());

// Decimal.js → Prisma Decimal  
const prismaAmount = new Prisma.Decimal(amount.toFixed(2));
```

## Alternativas Consideradas

### 1. Integers (centavos)
- Store `9999` para `$99.99`
- Simple pero propenso a errores de conversión
- No funciona bien para crypto

### 2. bignumber.js
- Similar a Decimal.js
- Menos mantenido
- API menos intuitiva

### 3. dinero.js
- Librería específica para dinero
- Más opinada
- Overhead innecesario

## Consecuencias

### Positivas
- Precisión garantizada en todos los cálculos
- Sin errores de redondeo
- Auditorías financieras satisfechas
- Soporte multi-moneda nativo

### Negativas
- Serialización manual en boundaries
- Slightly más verbose que números nativos
- Tests deben usar strings para comparaciones

## Reglas de Implementación

1. **NUNCA** usar `number` para valores monetarios
2. **SIEMPRE** usar `Decimal.js` para operaciones
3. **SIEMPRE** usar `toFixed(2)` antes de guardar
4. **SIEMPRE** validar input con regex
5. **NUNCA** confiar en conversiones implícitas

## Referencias
- [Prisma Decimal](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#decimal)
- [Decimal.js](https://mikemcl.github.io/decimal.js/)
- [What Every Programmer Should Know About Floating-Point](https://floating-point-gui.de/)
