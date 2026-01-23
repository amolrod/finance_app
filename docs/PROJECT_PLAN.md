# Personal Finance App - Project Plan

## 1. Visión General

Aplicación financiera personal moderna para gestión de gastos e inversiones, con opción futura de suscripción.

### Objetivos MVP (Sprint 1)
- Registro y autenticación de usuarios
- Gestión de cuentas financieras
- Categorización de transacciones
- Registro de ingresos/gastos/transferencias
- Listado con filtros básicos

## 2. Decisiones de Stack

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| **Frontend** | Next.js 14 + TypeScript | SSR/SSG, App Router, React Server Components |
| **Styling** | Tailwind CSS + shadcn/ui | Rápido desarrollo, componentes accesibles |
| **State** | TanStack Query | Cache, sincronización, optimistic updates |
| **Backend** | NestJS + TypeScript | Modular, DI, decoradores, OpenAPI integrado |
| **ORM** | Prisma | Type-safe, migraciones declarativas, studio |
| **Database** | PostgreSQL 16 | ACID, JSONB, extensiones, madurez |
| **Cache** | Redis 7 | Sessions, rate limiting, jobs queue |
| **Auth** | JWT + Refresh tokens | Stateless, preparado para OAuth |
| **Money** | Decimal.js + NUMERIC(18,2) | Precisión financiera sin floats |

## 3. Estructura del Repositorio

```
personal-finance-app/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   ├── migrations/     # SQL migrations
│   │   │   └── seed.ts         # Demo data
│   │   ├── src/
│   │   │   ├── common/         # Shared utilities
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/
│   │   │   │   ├── accounts/
│   │   │   │   ├── categories/
│   │   │   │   ├── transactions/
│   │   │   │   ├── tags/
│   │   │   │   ├── budgets/
│   │   │   │   └── health/
│   │   │   ├── prisma/         # Database service
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/
│   │
│   └── web/                    # Next.js Frontend
│       ├── app/                # App Router
│       ├── components/         # UI components
│       ├── lib/                # Utilities
│       └── hooks/              # Custom hooks
│
├── packages/
│   └── shared/                 # Shared types (future)
│
├── docs/
│   ├── adr/                    # Architecture Decision Records
│   ├── api/                    # API documentation
│   └── backlog/                # Sprint backlogs
│
├── scripts/                    # Utility scripts
├── docker-compose.yml          # Local development
├── turbo.json                  # Monorepo build config
└── package.json                # Root workspace
```

## 4. Cómo Correr el Proyecto

### Requisitos
- Node.js >= 20.x
- Docker & Docker Compose
- npm >= 10.x

### Setup Inicial

```bash
# 1. Clonar e instalar
git clone <repo-url>
cd personal-finance-app
npm install

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar servicios (PostgreSQL + Redis)
docker-compose up -d

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Seed con datos demo (opcional)
npm run db:seed

# 6. Iniciar desarrollo
npm run dev
```

### URLs de Desarrollo
- **API**: http://localhost:3001
- **Swagger/OpenAPI**: http://localhost:3001/docs
- **Frontend**: http://localhost:3000
- **Prisma Studio**: `npm run db:studio`
- **Adminer (DB GUI)**: http://localhost:8080 (profile: tools)

### Credenciales Demo
- Email: `demo@example.com`
- Password: `DemoPass123`

## 5. Endpoints Base (MVP)

### Auth (`/api/v1/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with credentials |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Revoke tokens |
| GET | `/profile` | Get current user |

### Accounts (`/api/v1/accounts`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all accounts |
| GET | `/summary` | Get balance summary |
| GET | `/:id` | Get account details |
| POST | `/` | Create account |
| PUT | `/:id` | Update account |
| DELETE | `/:id` | Archive/delete account |

### Categories (`/api/v1/categories`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List categories (tree) |
| GET | `/:id` | Get category |
| POST | `/` | Create category |
| PUT | `/:id` | Update category |
| DELETE | `/:id` | Delete category |

### Transactions (`/api/v1/transactions`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List with filters |
| GET | `/export/csv` | Export as CSV |
| GET | `/:id` | Get transaction |
| POST | `/` | Create transaction |
| PUT | `/:id` | Update transaction |
| DELETE | `/:id` | Soft delete |

### Budgets (`/api/v1/budgets`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List budgets |
| GET | `/status` | Current month status |
| GET | `/:id` | Get budget |
| POST | `/` | Create budget |
| PUT | `/:id` | Update budget |
| DELETE | `/:id` | Delete budget |

### Tags (`/api/v1/tags`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List tags |
| POST | `/` | Create tag |
| PUT | `/:id` | Update tag |
| DELETE | `/:id` | Delete tag |

### Health (`/api/v1/health`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/ready` | Readiness probe |

## 6. Modelo de Datos Principal

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────<│   Account   │     │  Category   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ email       │     │ user_id     │     │ user_id     │
│ password    │     │ name        │     │ name        │
│ created_at  │     │ type        │     │ type        │
└─────────────┘     │ currency    │     │ parent_id   │
       │            │ balance     │     └─────────────┘
       │            └─────────────┘            │
       │                   │                   │
       │                   │                   │
       │            ┌──────┴───────┐          │
       └───────────>│ Transaction  │<─────────┘
                    ├──────────────┤
                    │ id           │
                    │ user_id      │
                    │ account_id   │
                    │ category_id  │
                    │ type         │
                    │ amount       │◄── DECIMAL(18,2)
                    │ occurred_at  │
                    │ deleted_at   │◄── Soft delete
                    └──────────────┘
                           │
                    ┌──────┴───────┐
                    │     Tag      │
                    ├──────────────┤
                    │ id           │
                    │ name         │
                    └──────────────┘
```

## 7. Principios de Implementación

### Money Handling
- DB: `NUMERIC(18,2)` para fiat, `NUMERIC(18,8)` para crypto
- Runtime: `Decimal.js` para todos los cálculos
- API: Strings para valores monetarios (`"99.99"`)
- **NUNCA usar float/double**

### Ledger Integrity
- Soft-delete con `deleted_at`
- Reversals para cambios significativos
- Audit log para operaciones críticas
- Balances calculados y cacheados

### Security
- Argon2id para password hashing
- JWT con refresh tokens
- Rate limiting en auth endpoints
- Helmet para headers de seguridad
- Validación estricta de DTOs
- Multi-tenant por `user_id`

## 8. Próximos Pasos (Sprint 1)

1. ✅ Setup monorepo con Turborepo
2. ✅ Docker Compose para desarrollo
3. ✅ Schema Prisma con migraciones
4. ✅ API NestJS con Swagger
5. ⬜ Frontend Next.js con UI básica
6. ⬜ CI/CD con GitHub Actions
7. ⬜ Tests unitarios críticos
8. ⬜ README completo

---

**Última actualización**: 2026-01-09
**Versión**: 0.1.0
