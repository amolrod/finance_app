# ADR-003: Estrategia Append-Only / Soft-Delete / Reversals

## Estado
**Aceptado** - 2026-01-09

## Contexto
Un sistema financiero requiere integridad de datos absoluta y capacidad de auditoría.
Las transacciones NO deben poder eliminarse físicamente para mantener un registro
contable válido y cumplir con requisitos de compliance.

## Decisión

### Patrón: Append-Only con Soft-Delete + Reversals

```
┌────────────────────────────────────────────────────────────┐
│                    FLUJO DE MODIFICACIÓN                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │ Transaction │────>│ SOFT DELETE │────>│  deleted_at │  │
│  │  Original   │     │   (minor)   │     │  NOT NULL   │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                            │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │ Transaction │────>│  REVERSAL   │────>│    New Tx   │  │
│  │  Original   │     │   (major)   │     │  reverses   │  │
│  │             │<────│─────────────│<────│  original   │  │
│  │ reversed_by │     │             │     │             │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Tipos de Cambios

#### Cambios Menores (Soft-Delete directo)
- Descripción
- Notas
- Categoría
- Tags
- Fecha (sin impacto en balances)

```typescript
await prisma.transaction.update({
  where: { id },
  data: {
    description: newDescription,
    categoryId: newCategoryId,
  },
});
```

#### Cambios Mayores (Reversal Pattern)
- Monto
- Tipo (income/expense/transfer)
- Cuenta origen/destino

```typescript
// 1. Revertir balances
await revertAccountBalances(original);

// 2. Marcar original como revertido
await prisma.transaction.update({
  where: { id: original.id },
  data: {
    status: 'REVERSED',
    deletedAt: new Date(),
  },
});

// 3. Crear nueva transacción correcta
const corrected = await prisma.transaction.create({
  data: {
    ...correctedData,
    reversesId: original.id,
  },
});

// 4. Vincular original a corrección
await prisma.transaction.update({
  where: { id: original.id },
  data: { reversedById: corrected.id },
});
```

### Eliminación de Transacciones
NO existe hard delete. Solo:

```typescript
async remove(transactionId: string): Promise<void> {
  // 1. Revertir impacto en balances
  await this.revertBalances(transaction);
  
  // 2. Soft delete
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      deletedAt: new Date(),
      status: 'REVERSED',
    },
  });
}
```

### Schema

```prisma
model Transaction {
  id           String   @id @default(uuid())
  status       TransactionStatus @default(COMPLETED)
  deletedAt    DateTime? @map("deleted_at")
  
  // Para reversals
  reversedById String?   @map("reversed_by_id")
  reversesId   String?   @map("reverses_id")
  
  reversedBy   Transaction? @relation("Reversal", fields: [reversedById])
  reverses     Transaction? @relation("Reversal")
}

enum TransactionStatus {
  PENDING
  COMPLETED
  CANCELLED
  REVERSED
}
```

### Queries
Siempre filtrar por `deletedAt: null`:

```typescript
// Correcto
const transactions = await prisma.transaction.findMany({
  where: {
    userId,
    deletedAt: null,
  },
});

// Incluir revertidas (para auditoría)
const allTransactions = await prisma.transaction.findMany({
  where: { userId },
  include: { reversedBy: true, reverses: true },
});
```

## Consecuencias

### Positivas
- Auditoría completa de todos los cambios
- Cumplimiento con regulaciones financieras
- Posibilidad de "deshacer" cambios
- Histórico inmutable

### Negativas
- Queries más complejas (siempre filtrar deleted)
- Storage crece con correcciones
- UI debe mostrar estado REVERSED

## Audit Log Adicional
Para operaciones críticas, además del soft-delete:

```prisma
model AuditLog {
  id         String      @id
  userId     String
  action     AuditAction
  entityType String
  entityId   String?
  oldValue   Json?
  newValue   Json?
  createdAt  DateTime
}
```

## Referencias
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Soft Delete Best Practices](https://www.brentozar.com/archive/2020/02/soft-deletes-are-bad/)
