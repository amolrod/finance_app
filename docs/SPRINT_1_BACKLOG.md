# Sprint 1 Backlog - Personal Finance App

**Objetivo del Sprint**: Entregar un "vertical slice" end-to-end con autenticación,
gestión de cuentas, categorías y transacciones básicas.

**Duración**: 2 semanas
**Inicio**: Semana 1
**Fin**: Semana 2

---

## 🎯 Tickets

### FIN-001: Setup del Monorepo
**Título**: Configurar monorepo con Turborepo y workspaces

**Descripción**:
Como desarrollador, necesito una estructura de monorepo bien configurada para
poder desarrollar el backend y frontend en un solo repositorio con builds
optimizados.

**Criterios de Aceptación**:
- [ ] Configuración de npm workspaces con apps/api y apps/web
- [ ] Turborepo configurado con pipelines de build, lint y test
- [ ] TypeScript base config compartido
- [ ] Prettier y ESLint configurados
- [ ] .gitignore apropiado

**Notas Técnicas**:
- Usar Turborepo para caching de builds
- Estructura: `apps/api`, `apps/web`, `packages/shared`
- Node 20 LTS como versión mínima

**Estimación**: S (Small)

**Estado**: ✅ Completado

---

### FIN-002: Configuración de Docker Compose
**Título**: Crear docker-compose para servicios de desarrollo

**Descripción**:
Como desarrollador, necesito poder levantar PostgreSQL y Redis localmente
de forma rápida para desarrollo.

**Criterios de Aceptación**:
- [ ] PostgreSQL 16 configurado con volumen persistente
- [ ] Redis 7 con autenticación
- [ ] Script de inicialización de BD
- [ ] Archivo .env.example documentado

**Notas Técnicas**:
- Usar red bridge personalizada
- Healthchecks en ambos servicios
- Variables de entorno para credenciales

**Estimación**: S (Small)

**Estado**: ✅ Completado

---

### FIN-003: Esquema de Base de Datos
**Título**: Diseñar e implementar esquema Prisma completo

**Descripción**:
Como desarrollador, necesito un esquema de base de datos que soporte
todas las entidades del MVP con precisión numérica.

**Criterios de Aceptación**:
- [ ] Modelo User con campos de autenticación
- [ ] Modelo Account con tipos y balance DECIMAL(18,2)
- [ ] Modelo Category con jerarquía (parentId)
- [ ] Modelo Transaction con status y referencias
- [ ] Modelo Tag con relación many-to-many
- [ ] Modelo Budget con alertas
- [ ] Índices apropiados para queries frecuentes
- [ ] Seed script con datos de ejemplo

**Notas Técnicas**:
- Usar UUID como primary keys
- Campos de auditoría (createdAt, updatedAt, deletedAt)
- DECIMAL(18,2) para todos los campos monetarios
- DECIMAL(18,8) para crypto

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-004: Módulo de Autenticación
**Título**: Implementar autenticación JWT con refresh tokens

**Descripción**:
Como usuario, necesito poder registrarme, iniciar sesión y mantener
mi sesión activa de forma segura.

**Criterios de Aceptación**:
- [ ] Endpoint POST /auth/register con validación
- [ ] Endpoint POST /auth/login con rate limiting
- [ ] Endpoint POST /auth/refresh para renovar tokens
- [ ] Endpoint POST /auth/logout para invalidar refresh token
- [ ] Endpoint GET /auth/profile para obtener datos del usuario
- [ ] Passwords hasheados con Argon2id
- [ ] JWT con expiración de 15 minutos
- [ ] Refresh token con expiración de 7 días
- [ ] Categorías por defecto creadas en registro

**Notas Técnicas**:
- Usar @nestjs/jwt y @nestjs/passport
- Guardar refresh tokens hasheados en BD
- Rate limiting: 5 intentos por minuto en login
- Guards reutilizables para rutas protegidas

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-005: CRUD de Cuentas
**Título**: Implementar gestión completa de cuentas

**Descripción**:
Como usuario, necesito poder crear y gestionar múltiples cuentas
financieras para rastrear mis balances.

**Criterios de Aceptación**:
- [ ] GET /accounts - Listar cuentas del usuario
- [ ] GET /accounts/:id - Obtener cuenta específica
- [ ] GET /accounts/summary - Resumen con totales
- [ ] POST /accounts - Crear nueva cuenta
- [ ] PATCH /accounts/:id - Actualizar cuenta
- [ ] DELETE /accounts/:id - Soft delete de cuenta
- [ ] Validación de tipos de cuenta
- [ ] Soporte para múltiples monedas

**Notas Técnicas**:
- Tipos: CHECKING, SAVINGS, CREDIT_CARD, CASH, INVESTMENT
- Balance calculado con Decimal.js
- Color e icono personalizables
- Query param para incluir cuentas inactivas

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-006: CRUD de Categorías
**Título**: Implementar gestión de categorías jerárquicas

**Descripción**:
Como usuario, necesito organizar mis transacciones en categorías
con posibilidad de subcategorías.

**Criterios de Aceptación**:
- [ ] GET /categories - Listar categorías con filtro por tipo
- [ ] GET /categories/:id - Obtener categoría con hijos
- [ ] POST /categories - Crear categoría
- [ ] PATCH /categories/:id - Actualizar categoría
- [ ] DELETE /categories/:id - Eliminar categoría (no sistema)
- [ ] Categorías del sistema no eliminables
- [ ] Soporte para parentId (jerarquía de un nivel)

**Notas Técnicas**:
- Tipos: INCOME, EXPENSE
- Categorías del sistema creadas en seed
- Incluir color e icono
- Validar que parentId pertenezca al mismo usuario

**Estimación**: S (Small)

**Estado**: ✅ Completado

---

### FIN-007: CRUD de Transacciones
**Título**: Implementar gestión de transacciones con precisión

**Descripción**:
Como usuario, necesito registrar mis ingresos, gastos y transferencias
con total precisión numérica.

**Criterios de Aceptación**:
- [ ] GET /transactions - Listar con filtros y paginación
- [ ] GET /transactions/:id - Obtener transacción
- [ ] POST /transactions - Crear transacción
- [ ] PATCH /transactions/:id - Actualizar (crea reversión)
- [ ] DELETE /transactions/:id - Cancelar (crea reversión)
- [ ] GET /transactions/export - Exportar a CSV
- [ ] Actualización automática de balances
- [ ] Validación de cuentas y categorías del usuario

**Notas Técnicas**:
- Tipos: INCOME, EXPENSE, TRANSFER
- Status: PENDING, COMPLETED, CANCELLED, REVERSED
- Nunca eliminar físicamente, siempre revertir
- Usar Decimal.js para todos los cálculos
- Transferencias: debitar origen, acreditar destino

**Estimación**: L (Large)

**Estado**: ✅ Completado

---

### FIN-008: CRUD de Presupuestos
**Título**: Implementar gestión de presupuestos con alertas

**Descripción**:
Como usuario, necesito establecer límites de gasto y recibir
alertas cuando me acerque a ellos.

**Criterios de Aceptación**:
- [ ] GET /budgets - Listar presupuestos
- [ ] GET /budgets/:id - Obtener presupuesto
- [ ] GET /budgets/alerts - Obtener presupuestos en alerta
- [ ] POST /budgets - Crear presupuesto
- [ ] PATCH /budgets/:id - Actualizar presupuesto
- [ ] DELETE /budgets/:id - Eliminar presupuesto
- [ ] Cálculo automático de spent
- [ ] Períodos: WEEKLY, MONTHLY, QUARTERLY, YEARLY

**Notas Técnicas**:
- Vincular opcionalmente a categoría
- alertThreshold configurable (default 80%)
- spent se calcula sumando transacciones del período
- Incluir nombre de categoría en respuesta

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-009: Frontend - Setup Next.js
**Título**: Configurar aplicación Next.js con Tailwind

**Descripción**:
Como desarrollador, necesito la estructura base del frontend
con todas las configuraciones necesarias.

**Criterios de Aceptación**:
- [ ] Next.js 14 con App Router
- [ ] Tailwind CSS configurado
- [ ] TanStack Query para estado del servidor
- [ ] Zustand para estado global
- [ ] Componentes UI base (shadcn style)
- [ ] Cliente API con interceptores

**Notas Técnicas**:
- Usar CSS variables para theming
- Dark mode con next-themes
- Decimal.js para formateo de moneda
- Axios con refresh token automático

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-010: Frontend - Autenticación
**Título**: Implementar flujo de autenticación

**Descripción**:
Como usuario, necesito poder registrarme e iniciar sesión
desde la aplicación web.

**Criterios de Aceptación**:
- [ ] Página de login con validación
- [ ] Página de registro con indicador de fuerza de contraseña
- [ ] Persistencia de sesión en localStorage
- [ ] Redirección automática según estado de auth
- [ ] Logout con limpieza de estado

**Notas Técnicas**:
- React Hook Form + Zod para validación
- Store de auth con Zustand + persist
- Interceptor para refresh token automático
- Credenciales demo visibles en login

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-011: Frontend - Dashboard
**Título**: Implementar página principal del dashboard

**Descripción**:
Como usuario, necesito ver un resumen de mis finanzas
al acceder a la aplicación.

**Criterios de Aceptación**:
- [ ] Layout con sidebar y header
- [ ] Cards de balance total, ingresos y gastos del mes
- [ ] Lista de transacciones recientes
- [ ] Estado de presupuestos activos
- [ ] Lista de cuentas con balances
- [ ] Responsive design

**Notas Técnicas**:
- Sidebar colapsable en móvil
- Usar componentes de Progress para presupuestos
- Formateo de moneda con locale es-ES
- Skeleton loaders mientras carga

**Estimación**: M (Medium)

**Estado**: ✅ Completado

---

### FIN-012: Frontend - Páginas CRUD
**Título**: Implementar páginas de gestión de entidades

**Descripción**:
Como usuario, necesito poder gestionar mis cuentas, categorías,
transacciones y presupuestos desde la web.

**Criterios de Aceptación**:
- [ ] Página de cuentas con listado y formulario de creación
- [ ] Página de categorías con tabs por tipo
- [ ] Página de transacciones con filtros
- [ ] Página de presupuestos con barras de progreso
- [ ] Página de etiquetas
- [ ] Diálogos de confirmación para eliminar
- [ ] Toast notifications para feedback

**Notas Técnicas**:
- Dialog de Radix UI para formularios
- Select components para dropdowns
- Colorpicker simple con colores predefinidos
- Optimistic updates donde sea posible

**Estimación**: L (Large)

**Estado**: ✅ Completado

---

### FIN-013: Documentación
**Título**: Crear documentación del proyecto

**Descripción**:
Como desarrollador, necesito documentación clara para
entender y contribuir al proyecto.

**Criterios de Aceptación**:
- [ ] README.md con instrucciones de setup
- [ ] ADR-001: Selección de ORM
- [ ] ADR-002: Manejo de dinero
- [ ] ADR-003: Integridad del ledger
- [ ] ADR-004: Cache de precios
- [ ] PROJECT_PLAN.md con visión general
- [ ] Swagger/OpenAPI en el backend

**Notas Técnicas**:
- ADRs en formato estándar
- README con badges y quick start
- Swagger auto-generado con @nestjs/swagger

**Estimación**: S (Small)

**Estado**: ✅ Completado

---

## 📊 Resumen del Sprint

| Tamaño | Cantidad | Tickets |
|--------|----------|---------|
| Small (S) | 4 | FIN-001, FIN-002, FIN-006, FIN-013 |
| Medium (M) | 7 | FIN-003, FIN-004, FIN-005, FIN-008, FIN-009, FIN-010, FIN-011 |
| Large (L) | 2 | FIN-007, FIN-012 |

**Total**: 13 tickets

## 🏁 Definition of Done

- [ ] Código revisado y aprobado
- [ ] Tests unitarios pasan
- [ ] Sin errores de TypeScript
- [ ] Linting sin warnings
- [ ] Documentación actualizada
- [ ] Funcionalidad verificada manualmente

---

## 📝 Notas del Sprint

### Decisiones tomadas:
1. Usar Decimal.js en lugar de dinero.js por mejor soporte de TypeScript
2. Implementar soft-delete con patrón de reversiones para transacciones
3. Categorías del sistema no editables ni eliminables
4. Refresh token con hash en BD en lugar de JWT

### Riesgos identificados:
1. Complejidad del sistema de reversiones de transacciones
2. Performance de cálculos de presupuesto en tiempo real

### Dependencias externas:
- PostgreSQL 16+
- Redis 7+
- Node.js 20+
