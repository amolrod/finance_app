# 🗺️ Roadmap V2 - Finance App

**Fecha**: 17 de enero de 2026  
**Versión actual**: 0.0.1 (Sprints 1-5 completados)  
**Puntuación actual**: 7/10

---

## 📊 Estado Actual

### ✅ Completado
- [x] Autenticación (JWT + Refresh tokens)
- [x] Cuentas (CRUD + Multi-moneda)
- [x] Transacciones (CRUD + Filtros + Transferencias)
- [x] Categorías (Jerárquicas + Iconos)
- [x] Etiquetas (CRUD + Colores)
- [x] Presupuestos (Por categoría + Alertas)
- [x] Transacciones Recurrentes (Todas las frecuencias)
- [x] Inversiones (Portfolio + P&L)
- [x] Multi-moneda (Conversión global)
- [x] Notificaciones In-app
- [x] Importación CSV
- [x] Reportes básicos
- [x] Dashboard con gráficos

---

## 🚀 Plan de Mejoras

### Sprint 6: Configuración y Seguridad Básica
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Página de Settings funcional | 🔴 Alta | ✅ Completado |
| 2 | Cambiar contraseña | 🔴 Alta | ✅ Completado |
| 3 | Preferencias de usuario (moneda, tema) | 🟡 Media | ✅ Completado |
| 4 | Eliminar cuenta | 🟡 Media | ✅ Completado |

**Implementado**:
- Backend: `PATCH /auth/profile`, `POST /auth/change-password`, `DELETE /auth/account`
- Frontend: Hooks `useUpdateProfile`, `useChangePassword`, `useDeleteAccount`
- UI: Formularios funcionales con validación y feedback

---

### Sprint 7: Recuperación de Cuenta
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Flujo "Olvidé mi contraseña" | 🔴 Alta | ✅ Completado |
| 2 | Envío de email con token | 🔴 Alta | ✅ Completado |
| 3 | Página de reset password | 🔴 Alta | ✅ Completado |
| 4 | Integración con servicio de email (Resend/SendGrid) | 🔴 Alta | ✅ Completado |

**Implementado**:
- Backend: Modelo `PasswordResetToken`, `EmailService` con Resend
- Endpoints: `POST /auth/forgot-password`, `POST /auth/verify-reset-token`, `POST /auth/reset-password`
- Frontend: Páginas `/auth/forgot-password` y `/auth/reset-password`
- UI: Enlace "¿Olvidaste tu contraseña?" en login, verificación de token, formulario de nueva contraseña

---

### Sprint 8: Búsqueda y UX
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Búsqueda global en header (Command+K) | 🔴 Alta | ✅ Completado |
| 2 | Buscar transacciones, cuentas, categorías | 🔴 Alta | ✅ Completado |
| 3 | Atajos de teclado | 🟡 Media | ✅ Completado |
| 4 | Edición inline de transacciones | 🟡 Media | ✅ Completado |

**Implementado**:
- Backend: Módulo `SearchModule` con endpoint `GET /search?q=`
- Frontend: `CommandPalette` con cmdk, integrado en Header
- Atajos: `⌘K` búsqueda, `g+d/t/a/b/c/i/s` navegación rápida, `/` búsqueda
- `KeyboardShortcutsProvider` como contexto global
- Edición inline ya existía en la tabla de transacciones

---

### Sprint 9: Testing ✅
**Duración estimada**: 2 semanas

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Configurar Jest + mocks de Prisma | 🔴 Alta | ✅ Completado |
| 2 | Tests unitarios: AuthService | 🔴 Alta | ✅ Completado |
| 3 | Tests unitarios: TransactionsService | 🔴 Alta | ✅ Completado |
| 4 | Tests unitarios: BudgetsService | 🟡 Media | ✅ Completado |
| 5 | Configurar React Testing Library | 🟡 Media | ✅ Completado |
| 6 | Tests de componentes críticos | 🟡 Media | ✅ Completado |
| 7 | Configurar Playwright E2E | 🟢 Baja | ⬜ Pendiente |
| 8 | GitHub Actions para tests | 🟡 Media | ⬜ Pendiente |

**Implementado**:
- Backend: Jest + jest-mock-extended para mocking de Prisma
- Tests AuthService: 16 tests (register, login, refreshTokens, logout, getProfile)
- Tests TransactionsService: 16 tests (create, findAll, findOne, update, remove)
- Tests BudgetsService: 14 tests (create, findAll, findOne, update, remove, getStatus, updateSpentAmount)
- Frontend: Jest + React Testing Library + next/jest
- Tests Button: 13 tests (variantes, sizes, loading, click events, disabled)
- Tests Card: 14 tests (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter)
- **Total: 73 tests pasando** (46 backend + 27 frontend)

---

### Sprint 10: PWA y Mobile
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Manifest.json | 🟡 Media | ⬜ Pendiente |
| 2 | Service Worker básico | 🟡 Media | ⬜ Pendiente |
| 3 | Iconos para PWA | 🟡 Media | ⬜ Pendiente |
| 4 | Instalable en móvil | 🟡 Media | ⬜ Pendiente |
| 5 | Offline básico (caché de assets) | 🟢 Baja | ⬜ Pendiente |

---

### Sprint 11: Seguridad Avanzada
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | 2FA con TOTP | 🔴 Alta | ⬜ Pendiente |
| 2 | QR code para Google Authenticator | 🔴 Alta | ⬜ Pendiente |
| 3 | Códigos de respaldo | 🟡 Media | ⬜ Pendiente |
| 4 | Ver sesiones activas | 🟡 Media | ⬜ Pendiente |
| 5 | Revocar sesiones | 🟡 Media | ⬜ Pendiente |

---

### Sprint 12: Metas de Ahorro
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Modelo Goal en Prisma | 🟡 Media | ⬜ Pendiente |
| 2 | CRUD de metas | 🟡 Media | ⬜ Pendiente |
| 3 | Contribuciones a metas | 🟡 Media | ⬜ Pendiente |
| 4 | Progreso visual | 🟡 Media | ⬜ Pendiente |
| 5 | Widget en dashboard | 🟡 Media | ⬜ Pendiente |

---

### Sprint 13: Reportes Avanzados
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Exportación a PDF | 🟡 Media | ⬜ Pendiente |
| 2 | Comparativa mes vs mes anterior | 🟡 Media | ⬜ Pendiente |
| 3 | Comparativa año vs año | 🟢 Baja | ⬜ Pendiente |
| 4 | Informe fiscal anual | 🟢 Baja | ⬜ Pendiente |

---

### Sprint 14: Automatización
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Reglas de auto-categorización | 🟡 Media | ⬜ Pendiente |
| 2 | Detección de duplicados | 🟡 Media | ⬜ Pendiente |
| 3 | Split transactions | 🟢 Baja | ⬜ Pendiente |
| 4 | Adjuntar recibos/imágenes | 🟢 Baja | ⬜ Pendiente |

---

### Sprint 15: Notificaciones por Email
**Duración estimada**: 1 semana

| # | Tarea | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Resumen semanal por email | 🟡 Media | ⬜ Pendiente |
| 2 | Alertas de presupuesto por email | 🟡 Media | ⬜ Pendiente |
| 3 | Recordatorios de recurrentes | 🟢 Baja | ⬜ Pendiente |
| 4 | Preferencias de notificación | 🟢 Baja | ⬜ Pendiente |

---

## 📈 Objetivos de Puntuación

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Funcionalidad | 8.5/10 | 9.5/10 |
| UI/UX | 8/10 | 9/10 |
| Seguridad | 6/10 | 9/10 |
| Testing | 1/10 | 8/10 |
| Mobile Ready | 4/10 | 8/10 |
| **Total** | **7/10** | **9/10** |

---

## 📅 Cronograma Estimado

| Sprint | Semana | Objetivo |
|--------|--------|----------|
| Sprint 6 | Ene 17-24 | Settings + Cambiar contraseña |
| Sprint 7 | Ene 24-31 | Recuperación de contraseña |
| Sprint 8 | Feb 1-7 | Búsqueda global |
| Sprint 9 | Feb 7-21 | Testing (2 semanas) |
| Sprint 10 | Feb 21-28 | PWA |
| Sprint 11 | Mar 1-7 | 2FA |
| Sprint 12 | Mar 7-14 | Metas de ahorro |
| Sprint 13 | Mar 14-21 | Reportes PDF |
| Sprint 14 | Mar 21-28 | Automatización |
| Sprint 15 | Mar 28 - Abr 4 | Emails |

**Fecha estimada de v1.0**: Abril 2026

---

## 🔧 Notas Técnicas

### Stack actual
- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + React Query + Tailwind
- **Auth**: JWT + Refresh tokens
- **Monorepo**: Turborepo + Bun

### Dependencias a añadir
- `@react-email/components` - Emails bonitos
- `resend` o `@sendgrid/mail` - Envío de emails
- `otplib` - Generación de TOTP para 2FA
- `qrcode` - QR codes para 2FA
- `@react-pdf/renderer` - Generación de PDFs
- `next-pwa` - PWA support
- `jest` + `@testing-library/react` - Testing
- `playwright` - E2E tests

---

**Última actualización**: 17 de enero de 2026
