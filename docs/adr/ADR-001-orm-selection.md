# ADR-001: Selección de ORM (Prisma)

## Estado
**Aceptado** - 2026-01-09

## Contexto
Necesitamos un ORM para interactuar con PostgreSQL que cumpla:
- Type-safety completo con TypeScript
- Sistema de migraciones robusto
- Buen rendimiento en queries complejas
- Soporte para tipos DECIMAL

## Opciones Consideradas

### 1. Prisma
**Pros:**
- Schema declarativo y legible
- Client auto-generado 100% type-safe
- Migraciones versionadas automáticas
- Prisma Studio para debugging
- Excelente DX y documentación
- Soporte nativo para PostgreSQL features

**Contras:**
- Curva de aprendizaje inicial
- Algunas queries complejas requieren `$queryRaw`
- Bundle size mayor

### 2. TypeORM
**Pros:**
- Maduro y estable
- Decoradores familiares
- Active Record + Data Mapper

**Contras:**
- Type-safety limitado en runtime
- Migraciones más manuales
- Mantenimiento irregular
- Issues conocidos con Decimal

### 3. Drizzle
**Pros:**
- Muy ligero
- SQL-first approach
- Excelente type-safety

**Contras:**
- Ecosistema más nuevo
- Menos tooling disponible

## Decisión
**Elegimos Prisma** por:
1. Type-safety superior que elimina errores en tiempo de compilación
2. Schema declarativo que sirve como documentación
3. Migraciones automáticas que facilitan CI/CD
4. Prisma Studio para desarrollo y debugging
5. Soporte robusto para `Decimal` con `@db.Decimal(18,2)`

## Consecuencias
- Usar `Decimal.js` en runtime para operaciones
- Definir precision explícita en schema
- Usar `$queryRaw` para queries analíticas complejas
- Generar client después de cada cambio de schema

## Referencias
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with Decimal](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#decimal)
