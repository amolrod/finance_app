# 💰 Personal Finance App

Una aplicación moderna de gestión de finanzas personales construida con precisión numérica y las mejores prácticas de desarrollo.

## 📋 Características

- **Múltiples Cuentas**: Gestiona cuentas corrientes, ahorros, tarjetas de crédito, efectivo e inversiones
- **Transacciones**: Registra ingresos, gastos y transferencias con precisión decimal
- **Categorías Jerárquicas**: Organiza tus movimientos con categorías personalizables
- **Presupuestos**: Establece límites de gasto con alertas automáticas
- **Etiquetas**: Sistema de etiquetado flexible para clasificación avanzada
- **Exportación CSV**: Descarga tus transacciones para análisis externo

## 🏗️ Arquitectura

```
finances/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Next.js
├── packages/
│   └── shared/       # Tipos y utilidades compartidas (futuro)
├── docs/
│   ├── adr/          # Architecture Decision Records
│   └── PROJECT_PLAN.md
└── scripts/          # Scripts de utilidad
```

## 🛠️ Stack Tecnológico

### Backend (apps/api)
- **NestJS 10** - Framework Node.js empresarial
- **Prisma 5** - ORM con type-safety
- **PostgreSQL 16** - Base de datos relacional
- **Redis 7** - Cache y sesiones
- **Argon2** - Hashing de contraseñas
- **Decimal.js** - Precisión numérica

### Frontend (apps/web)
- **Next.js 14** - Framework React con App Router
- **TanStack Query** - Estado del servidor
- **Tailwind CSS** - Estilos utilitarios
- **Radix UI** - Componentes accesibles
- **Zustand** - Estado global
- **React Hook Form + Zod** - Formularios con validación

## 🚀 Inicio Rápido

### Prerrequisitos

- **Bun 1.1+** - [Instalar Bun](https://bun.sh)
- Docker y Docker Compose

### 1. Clonar e instalar

```bash
cd finances
bun install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Levantar servicios con Docker

```bash
docker-compose up -d
```

Esto inicia:
- PostgreSQL en `localhost:5432`
- Redis en `localhost:6379`

### 4. Configurar base de datos

```bash
cd apps/api

# Generar cliente Prisma
bunx prisma generate

# Ejecutar migraciones
bunx prisma migrate dev

# Cargar datos de prueba (opcional)
bunx prisma db seed
```

### 5. Iniciar aplicaciones

```bash
# Desde la raíz del monorepo
bun run dev

# O individualmente:
# Backend: cd apps/api && bun run start:dev
# Frontend: cd apps/web && bun run dev
```

### 6. Acceder a la aplicación

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **Swagger**: http://localhost:3001/api/docs

### Credenciales de demo

```
Email: demo@example.com
Password: DemoPass123
```

## 📚 Documentación

### ADRs (Architecture Decision Records)

| ADR | Título | Estado |
|-----|--------|--------|
| [ADR-001](docs/adr/ADR-001-orm-selection.md) | Selección de ORM (Prisma) | Aceptado |
| [ADR-002](docs/adr/ADR-002-money-handling.md) | Manejo de dinero (Decimal.js) | Aceptado |
| [ADR-003](docs/adr/ADR-003-ledger-integrity.md) | Integridad del ledger | Aceptado |
| [ADR-004](docs/adr/ADR-004-market-price-cache.md) | Cache de precios | Aceptado |

### API Endpoints

| Módulo | Endpoint | Descripción |
|--------|----------|-------------|
| Auth | `POST /api/v1/auth/register` | Registro de usuario |
| Auth | `POST /api/v1/auth/login` | Inicio de sesión |
| Auth | `POST /api/v1/auth/refresh` | Renovar tokens |
| Accounts | `GET /api/v1/accounts` | Listar cuentas |
| Accounts | `POST /api/v1/accounts` | Crear cuenta |
| Transactions | `GET /api/v1/transactions` | Listar transacciones |
| Transactions | `POST /api/v1/transactions` | Crear transacción |
| Categories | `GET /api/v1/categories` | Listar categorías |
| Budgets | `GET /api/v1/budgets` | Listar presupuestos |

Ver documentación completa en Swagger: http://localhost:3001/api/docs

## 🧪 Testing

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Coverage
bun run test:cov
```

## 📦 Scripts Disponibles

```bash
# Desarrollo
bun run dev           # Inicia todos los apps en modo desarrollo
bun run build         # Build de producción
bun run lint          # Linting
bun run format        # Formatear código

# Base de datos
bun run db:migrate    # Ejecutar migraciones
bun run db:seed       # Cargar datos de prueba
bun run db:studio     # Abrir Prisma Studio
```

## 🔐 Seguridad

- Contraseñas hasheadas con Argon2id
- JWT con refresh tokens
- Rate limiting en endpoints de autenticación
- Helmet para headers de seguridad
- Validación estricta de inputs con class-validator

## 💡 Principios de Diseño

1. **Precisión Numérica**: Nunca usamos float/double para dinero. Todo es Decimal.js + NUMERIC en DB.
2. **Append-Only Ledger**: Las transacciones nunca se eliminan, solo se reversan.
3. **Type Safety**: TypeScript estricto en todo el stack.
4. **API First**: REST con versionado /api/v1.
5. **Soft Delete**: Los datos sensibles usan borrado lógico.

## 🗺️ Roadmap

- [x] Sprint 1: MVP (Auth, Cuentas, Transacciones, Categorías)
- [ ] Sprint 2: Dashboard avanzado, gráficos
- [ ] Sprint 3: Transacciones recurrentes
- [ ] Sprint 4: Módulo de inversiones
- [ ] Sprint 5: Multi-moneda
- [ ] Sprint 6: PWA y mobile

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ para una mejor gestión financiera personal.
