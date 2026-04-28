# 🚀 Guía Despliegue: Vercel + Neon

Esta guía te llevará paso a paso para desplegar la aplicación de finanzas personales usando **Vercel** (hosting) y **Neon** (PostgreSQL serverless).

## 📋 Prerrequisitos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com) (login con GitHub)
- Cuenta en [Neon](https://neon.tech) (login con GitHub)

---

## 🗄️ Paso 1: Configurar Neon (Base de Datos)

### 1.1 Crear proyecto en Neon

1. Ve a [console.neon.tech](https://console.neon.tech)
2. Click en **"New Project"**
3. Configura:
   - **Name**: `finances-db`
   - **Region**: Elige el más cercano a ti (ej: `aws-eu-central-1`)
   - **Postgres version**: 16 (última)
4. Click **"Create Project"**

### 1.2 Obtener Connection String

1. En el dashboard del proyecto, copia el **Connection String**
2. Se verá algo así:
   ```
   postgresql://username:password@ep-xxx-yyy.region.aws.neon.tech/neondb?sslmode=require
   ```
3. **Guárdalo**, lo necesitarás para configurar Vercel

---

## 🔧 Paso 2: Subir código a GitHub

Si aún no lo tienes en GitHub:

```bash
cd /Users/angel/Desktop/finances
git init
git add .
git commit -m "Initial commit"
gh repo create finances --private --source=. --push
```

O si prefieres hacerlo manualmente:
1. Crea un repositorio en GitHub
2. Sigue las instrucciones para subir código existente

---

## 🖥️ Paso 3: Desplegar API (Backend)

### 3.1 Crear proyecto en Vercel para API

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Selecciona tu repositorio `finances`
4. Configura:
   - **Root Directory**: `apps/api`
   - **Framework Preset**: Other
   - **Build Command**: `bun run build && bunx prisma generate`
   - **Output Directory**: (dejar vacío)
   - **Install Command**: `bun install`

### 3.2 Configurar Variables de Entorno

En la sección **Environment Variables**, añade:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | `postgresql://...` (de Neon) |
| `JWT_SECRET` | Genera con `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Genera con `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CORS_ORIGINS` | `https://tu-frontend.vercel.app` (lo actualizarás después) |
| `NODE_ENV` | `production` |

5. Click **"Deploy"**

### 3.3 Ejecutar migraciones

Después del primer deploy, necesitas ejecutar las migraciones de Prisma:

**Opción A: Desde tu máquina local**
```bash
cd apps/api
DATABASE_URL="postgresql://..." bunx prisma migrate deploy
DATABASE_URL="postgresql://..." bunx prisma db seed
```

**Opción B: Usar Vercel CLI**
```bash
vercel env pull .env.production.local
bunx prisma migrate deploy
```

### 3.4 Verificar API

Tu API estará en: `https://tu-proyecto-api.vercel.app`

Prueba: `https://tu-proyecto-api.vercel.app/api/v1/health`

---

## 🌐 Paso 4: Desplegar Frontend (Web)

### 4.1 Crear proyecto en Vercel para Frontend

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Selecciona el mismo repositorio `finances`
4. Configura:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (auto-detectado)
   - **Build Command**: `bun run build`
   - **Install Command**: `bun install`

### 4.2 Configurar Variables de Entorno

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://tu-proyecto-api.vercel.app` |
| `NODE_ENV` | `production` |

5. Click **"Deploy"**

### 4.3 Actualizar CORS en API

Ahora que tienes la URL del frontend, vuelve al proyecto API en Vercel:

1. Settings → Environment Variables
2. Actualiza `CORS_ORIGINS` con la URL del frontend
3. Redeploy la API

---

## ✅ Paso 5: Verificar despliegue

1. **Frontend**: `https://tu-frontend.vercel.app`
2. **API Health**: `https://tu-api.vercel.app/api/v1/health`
3. **API Docs**: `https://tu-api.vercel.app/docs`

### Pruebas:
- [ ] Registro de usuario
- [ ] Login
- [ ] Crear cuenta
- [ ] Crear transacción
- [ ] Ver dashboard

---

## 🔄 Despliegues automáticos

Una vez configurado, cada push a `main` desplegará automáticamente:
- API en Vercel
- Frontend en Vercel

---

## 📊 Monitoreo

### Vercel
- **Analytics**: Vercel → Project → Analytics
- **Logs**: Vercel → Project → Logs (ver errores en tiempo real)

### Neon
- **Query Stats**: Neon Console → Monitoring
- **Connection pooling**: Habilitado por defecto

---

## 🆘 Solución de problemas

### Error: "Cannot find module..."
```bash
# Regenerar Prisma client
bunx prisma generate
```

### Error: "Connection refused" en DB
- Verifica que `DATABASE_URL` tenga `?sslmode=require`
- Verifica IP allowlist en Neon (por defecto permite todas)

### Error CORS
- Verifica que `CORS_ORIGINS` incluya la URL exacta del frontend
- No incluir trailing slash: `https://app.vercel.app` ✅
- Con trailing slash: `https://app.vercel.app/` ❌

### Migraciones no aplicadas
```bash
DATABASE_URL="tu-connection-string" bunx prisma migrate deploy
```

---

## 💡 Tips

1. **Dominio personalizado**: Vercel → Project → Settings → Domains
2. **Preview deployments**: Cada PR crea un preview automático
3. **Rollback**: Vercel → Deployments → selecciona uno anterior → Promote

---

## 📈 Límites del tier gratuito

### Vercel Free
- ✅ Unlimited deploys
- ✅ 100GB bandwidth/mes
- ✅ Serverless functions (10s timeout)
- ⚠️ 1 team member

### Neon Free
- ✅ 0.5 GB storage
- ✅ 3 GB data transfer/mes
- ✅ Autoscaling a 0 (ahorra recursos)
- ⚠️ 1 proyecto

---

¡Listo! Tu aplicación de finanzas está en producción 🎉
