# 📋 Tareas Pendientes - Personal Finance App

**Última actualización**: 10 de enero de 2026

## ✅ Sprint 1 - Completado

Todo el MVP del Sprint 1 está implementado:
- [x] Monorepo con Turborepo + Bun
- [x] Docker Compose (PostgreSQL 16 + Redis 7)
- [x] Schema Prisma completo
- [x] Backend NestJS (Auth, Accounts, Transactions, Categories, Budgets, Tags)
- [x] Frontend Next.js 14 con todas las páginas CRUD
- [x] ADRs (4 documentos)
- [x] CI/CD con GitHub Actions
- [x] README y documentación

### ✅ Correcciones Sprint 1.1
- [x] Fix: Puerto PostgreSQL cambiado a 5433 (conflicto con 5432)
- [x] Fix: Archivo `.env` creado en `apps/api/` para Prisma
- [x] Fix: Restricción `@unique` en campos de reversión en schema.prisma
- [x] Fix: Seed con `createMany` + `skipDuplicates` en lugar de `upsert`
- [x] Fix: `packageManager: "bun@1.1.0"` añadido a package.json raíz
- [x] Fix: `strictPropertyInitialization: false` en tsconfig del API
- [x] Fix: Tipos de Account corregidos (`currentBalance`, `isArchived`, `AccountListResponse`)
- [x] Fix: Hook `useAccounts` actualizado para extraer `.data` de respuesta
- [x] Fix: Tipos de Budget corregidos (`spentAmount`, `limitAmount`, `remainingAmount`, etc.)
- [x] Fix: Página de budgets actualizada con campos correctos del API
- [x] Fix: Hook `useBudgets` actualizado (parámetro `periodMonth` en lugar de `activeOnly`)
- [x] Fix: Tipos de Transaction corregidos (`occurredAt`, `transferToAccount`, etc.)
- [x] Fix: Hook `useTransactions` actualizado para estructura de respuesta sin `meta`
- [x] Fix: Formulario de creación de transacciones con campos correctos

### ✅ Correcciones Sprint 1.2 (TypeScript Build)
- [x] Fix: ESLint config - removida regla `@typescript-eslint/no-unused-vars` no instalada
- [x] Fix: AccountType incluye `BANK` en schema zod y mapeos
- [x] Fix: AccountSummary usa `byCurrency` en lugar de `currency`
- [x] Fix: Account usa `currentBalance` en lugar de `balance` en dashboard
- [x] Fix: TransactionListResponse usa `total` en lugar de `meta.total`
- [x] Fix: CreateAccountDto usa `initialBalance` en lugar de `balance`
- [x] Fix: useBudgetStatus en lugar de useBudgetAlerts (endpoint correcto)
- [x] Build de frontend exitoso ✅

---

## 🔄 Próximos Pasos Inmediatos

### Para ejecutar el proyecto por primera vez:

```bash
# 1. Instalar Bun si no lo tienes
curl -fsSL https://bun.sh/install | bash

# 2. Instalar dependencias
cd finances
bun install

# 3. Levantar PostgreSQL y Redis
docker-compose up -d

# 4. Configurar variables de entorno
cp .env.example .env

# 5. Configurar base de datos
cd apps/api
bunx prisma generate
bunx prisma migrate dev
bunx prisma db seed

# 6. Iniciar la aplicación
cd ../..
bun run dev
```
bun run dev
```

---

## 📝 Sprint 2 - En Progreso ✅

### ✅ FIN-014: Dashboard Avanzado - COMPLETADO
- [x] Gráfico de gastos por categoría (pie chart con Recharts)
- [x] Gráfico de evolución mensual (area chart ingresos vs gastos)
- [x] Widget de balance neto
- [x] Optimización de caché React Query (staleTime 5min, gcTime 30min)
- [x] placeholderData para carga instantánea

### ✅ FIN-015: Filtros Avanzados - COMPLETADO
- [x] Búsqueda de transacciones por texto
- [x] Filtro por rango de fechas con inputs date
- [x] Filtro por tipo (Ingreso/Gasto/Transferencia)
- [x] Filtro por cuenta

### ✅ FIN-016: Reportes - COMPLETADO
- [x] Nueva página /dashboard/reports
- [x] Reporte con filtro por fechas y presets (Este mes, Mes anterior, etc.)
- [x] Gráficos de tendencia y categorías
- [x] Tabla desglose por categoría
- [x] Exportación a CSV

---

## ✅ Sprint 3 - Completado

### ✅ FIN-017: Transacciones Recurrentes - COMPLETADO
- [x] Modelo RecurringTransaction en Prisma (enum RecurrenceFrequency + modelo completo)
- [x] Migración aplicada: `20260111103716_add_recurring_transactions`
- [x] CRUD de transacciones recurrentes (backend completo)
- [x] Frecuencias: diaria, semanal, quincenal, mensual, trimestral, anual
- [x] Job de creación automática (cron a las 6:00 AM)
- [x] Notificaciones de recordatorio (cron a las 8:00 AM)
- [x] UI para gestión de recurrentes (/dashboard/recurring)
- [x] Formulario de creación/edición con validación
- [x] Acciones: pausar, reanudar, eliminar, editar
- [x] Link en sidebar de navegación

### ✅ FIN-018: Notificaciones - COMPLETADO
- [x] Modelo Notification ya existía en Prisma
- [x] Backend completo (CRUD + helpers)
- [x] Notificaciones in-app (dropdown en header)
- [x] Badge con contador de no leídas (polling cada 30s)
- [x] Marcar como leída / marcar todas como leídas
- [x] Eliminar / eliminar todas
- [x] Alertas de presupuesto automáticas (ya integradas en budgets.service)
- [ ] Notificaciones por email (pendiente)

---

## ✅ Sprint 4 - Completado (Inversiones)

### ✅ FIN-019: Módulo de Holdings - COMPLETADO
- [x] Modelos Asset e InvestmentOperation ya existían en Prisma
- [x] Backend AssetsService (CRUD activos)
- [x] Backend InvestmentsService (CRUD operaciones + cálculo de holdings)
- [x] Cálculo de rentabilidad FIFO
- [x] Cálculo de P&L realizado y no realizado
- [x] API endpoints: /assets, /investments/operations, /investments/holdings, /investments/portfolio

### ✅ FIN-020: Precios de Mercado - COMPLETADO
- [x] MarketPriceService con cron job horario
- [x] Integración mock (preparada para Alpha Vantage / CoinGecko)
- [x] Almacenamiento en tabla market_prices
- [x] Método de refresh manual de precios

### ✅ FIN-021: Portfolio Dashboard - COMPLETADO
- [x] Página /dashboard/investments
- [x] Vista de portafolio con métricas (Total Invertido, Valor Actual, P&L)
- [x] Distribución por tipo de activo
- [x] Tabla de posiciones con P&L por activo
- [x] Historial de operaciones paginado
- [x] Formulario de nueva operación con creación de activos inline

---

## ✅ Sprint 5 - Completado (Multi-moneda)

### FIN-022: Soporte Multi-moneda - COMPLETADO
- [x] Campo currency ya existía en Account y Transaction
- [x] API de tipos de cambio (ExchangeRatesService con Frankfurter API)
- [x] Modelo ExchangeRate en Prisma (migración aplicada)
- [x] Endpoints: /exchange-rates/currencies, /exchange-rates/rate, /exchange-rates/convert, /exchange-rates/all, /exchange-rates/history, /exchange-rates/refresh
- [x] Cron job horario para actualizar tipos de cambio
- [x] Cron job diario para limpiar rates antiguos (>30 días)
- [x] Hook useExchangeRates para frontend
- [x] CurrencyContext para conversión global en frontend
- [x] CurrencySelector componente para cambiar moneda preferida
- [x] AccountSummary con conversión opcional a moneda destino
- [x] Auto-refresh de precios de inversiones cada 5 minutos
- [x] Mostrar totales convertidos en Dashboard principal
- [x] Selector de moneda en header

**Estimación**: L (Large) ✅

---

## 📝 Sprint 6 - Pendiente (Mobile)

### FIN-023: PWA
- [ ] Service Worker
- [ ] Manifest.json
- [ ] Offline support básico
- [ ] Push notifications

**Estimación**: M (Medium)

### FIN-024: App Móvil (Opcional)
- [ ] React Native / Expo
- [ ] Reutilización de lógica
- [ ] Notificaciones nativas

**Estimación**: XL (Extra Large)

---

## 🔧 Mejoras Técnicas Pendientes

### Testing
- [ ] Tests unitarios para servicios del backend (>80% coverage)
- [ ] Tests E2E con Playwright para el frontend
- [ ] Tests de integración para API
- [ ] Mocks de Prisma para tests aislados

### DevOps
- [ ] Dockerfile para producción (API y Web)
- [ ] Kubernetes manifests / Docker Compose producción
- [ ] Terraform para infraestructura en cloud
- [ ] Monitoreo con Prometheus + Grafana
- [ ] Logging centralizado (ELK / Loki)

### Seguridad
- [ ] Rate limiting más granular
- [ ] 2FA (Two-Factor Authentication)
- [ ] Audit log de acciones sensibles
- [ ] Penetration testing

### Performance
- [ ] Implementar paginación cursor-based
- [ ] Índices adicionales en queries frecuentes
- [ ] Query optimization con EXPLAIN
- [ ] CDN para assets estáticos

---

## 📊 Resumen de Prioridades

| Prioridad | Sprint | Tickets | Descripción |
|-----------|--------|---------|-------------|
| 🟢 Alta | 2 | FIN-014, FIN-015 | Dashboard y filtros |
| 🟡 Media | 3 | FIN-017, FIN-018 | Recurrentes y notificaciones |
| 🟡 Media | 4 | FIN-019-021 | Módulo inversiones |
| 🔵 Baja | 5-6 | FIN-022-024 | Multi-moneda y mobile |

---

## 📞 Notas

- El backend está **100% funcional** y listo para usar
- El frontend tiene todas las páginas CRUD funcionando
- Credenciales demo: `demo@example.com` / `DemoPass123`
- Swagger disponible en http://localhost:3001/api/docs

Para cualquier duda, revisar la documentación en `/docs/`.
