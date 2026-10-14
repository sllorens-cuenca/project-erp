# MEMORY.md — App de Almacén (project_erp)

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual

- **Fase web cerrada (Bloque A)**: primer arranque (`/setup`), usuarios (solo ADMIN),
  perfil + cambio de contraseña, historial de movimientos (`/movimientos`) y pulido UX
  (foco visible, reduced-motion, estados de error). Builds `shared`/`api`/`web` OK; API
  verificada end-to-end (14/14).
- Publicado en GitHub: `sllorens-cuenca/project-erp` (rama `main`).
- API NestJS :3001 (`/api`); web Next.js :3000. **Neon** (Postgres) en dev y prod
  (ramas `main`/`production`); seed `admin@almacen.local / admin1234`.
- **Verificado en local contra Neon**: build, migración `0_init`, seed, login, CRUD,
  CORS y recordatorio/email en `json`. Falta desplegar (Render API + Vercel web).
- Email local `json` (no envía); producción **Gmail SMTP** (contraseña de aplicación).
- Tooling: skills en `.agents/skills/`; MCP `github` global; `gh` CLI autenticado.

## Decisiones (y por qué)

- Monorepo con `packages/shared`: una sola fuente para enums/tipos de api y web. Las
  etiquetas de rol (`USER_ROLE_LABELS`) van ahí, junto a los demás `*_LABELS`.
- **PostgreSQL (Neon) en dev y prod** (mismo motor, sin sorpresas); esquema sin enums
  nativos (viven en `@erp/shared`). Neon porque las BD free de Render **se borran a los
  30 días** y la máquina no tiene Postgres/Docker local.
- Publicación: API en **Render free** (Frankfurt), web en **Vercel** (`apps/web`), email
  **Gmail SMTP** (contraseña de aplicación, sin dominio propio). Render free se duerme:
  el recordatorio diario no será fiable hasta pasar a un plan de pago.
- `matches()/normalizeText()` en vez de `contains` de Prisma: SQLite no normaliza acentos.
- Guards globales (`APP_GUARD`) + `@Public()` / `@Roles()`: seguro por defecto.
- Estados de listado con efectos en `lists.service.ts` (`CONFIRMADO` descuenta stock,
  `ENVIADO` envía email).
- Credenciales demo del login solo con `NODE_ENV !== 'production'`.
- `PATCH /api/auth/me` reemite el JWT: `name`/`role` van firmados en el token.
- Movimientos como sección propia del nav (filtros por material y obra).
- Node 22 vía nvm (el sistema trae v12).

## Aprendizajes y errores a evitar

- `nest build` con `deleteOutDir` + `incremental`: `tsBuildInfoFile` dentro de `dist/`.
- Compilar `@erp/shared` antes que api/web (su `main` apunta a `dist/`, no versionado).
- Cargar nvm en shells no interactivas (si no, `node -v` es v12).
- Migración base de Postgres sin BD: `prisma migrate diff --from-empty
  --to-schema-datamodel prisma/schema.prisma --script` → `migrations/0_init/`.
- Vercel monorepo: Root Directory `apps/web` + activar "Include source files outside of
  the Root Directory in the Build Step"; `apps/web/vercel.json` compila `@erp/shared`.
- Descargas/impresión protegidas: usar `downloadFile()` / `openPrintable()` (llevan JWT).
- `pkill -f "next dev"` se mata a sí mismo si el patrón está en la propia línea; usar el
  truco del corchete (`"next d[e]v"`) o matar por PID (`next-server` se llama distinto).
- Prisma + Neon: la cadena **pooled** (`-pooler`) funcionó (migraciones y consultas); para
  un proceso persistente es más simple la **directa**. Si el pooler diera errores de
  *prepared statements*, añadir `?pgbouncer=true`.
- Render build: usar `npm ci --include=dev` (prisma/@nestjs/cli/typescript son
  devDependencies y Render fija `NODE_ENV=production`; el build genera y `migrate deploy`).
- No hay tests, lint ni CI. OpenCode: `{env:...}` no se interpola en `headers` de MCP.

## Próximos pasos

- Bloque B: **Neon ✅** y verificación local ✅. Falta **desplegar**: Render (API) y
  Vercel (web) siguiendo `DEPLOY.md` (el usuario rellena secretos en Render + Gmail).
- Bloque C: app iOS sobre la misma API + push del recordatorio diario.
- Añadir tests y lint (hoy no existen).
