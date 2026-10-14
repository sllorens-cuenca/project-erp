# MEMORY.md — App de Almacén (project_erp)

Memoria entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Bloques A y B hechos**: fase web completa (primer arranque `/setup`, usuarios solo ADMIN,
  perfil + contraseña, movimientos, pulido UX) y **desplegada**: web
  `project-erp-vercel.vercel.app` (Vercel) + API `erp-api-bojd.onrender.com` (Render) + Neon
  `production`. Primer admin creado (`/setup` → `configured:true`).
- Dev: API NestJS :3001 (`/api`), web Next.js :3000, Neon rama `main`; seed
  `admin@almacen.local / admin1234`. Builds OK; API verificada end-to-end.
- GitHub `sllorens-cuenca/project-erp` (`main`). Email local `json` (no envía); prod **Gmail
  SMTP** (contraseña de aplicación). Tooling: skills en `.agents/skills/`; MCP `github`; `gh`.

## Decisiones (y por qué)

- Monorepo con `packages/shared`: una sola fuente para enums/tipos; las `*_LABELS` viven ahí.
- **PostgreSQL (Neon) en dev y prod** (mismo motor); esquema sin enums nativos (en shared).
  Neon porque las BD free de Render **se borran a los 30 días**.
- API en **Render free** (Frankfurt), web en **Vercel** (`apps/web`); Render free se duerme →
  recordatorio diario no fiable hasta pagar.
- Búsquedas con `matches()/normalizeText()` (sin acentos/mayúsculas).
- Guards globales (`APP_GUARD`) + `@Public()` / `@Roles()`: seguro por defecto.
- Estados de listado: efectos en `lists.service.ts` (`CONFIRMADO` descuenta stock, `ENVIADO`
  envía email).
- Credenciales demo del login solo si `NODE_ENV !== 'production'`; `PATCH /api/auth/me`
  reemite el JWT (`name`/`role` van firmados). Node 22 vía nvm.

## Aprendizajes y errores a evitar

- **Vercel**: `NEXT_PUBLIC_API_URL` se incrusta en **build**; si falta, la web usa
  `http://localhost:3001/api` → `NetworkError when attempting to fetch resource`. Hay que
  **redesplegar** y verificar que no quede `localhost` en el chunk servido.
- **Render/CORS**: `WEB_ORIGIN` = origen exacto de Vercel **sin barra final**; mal formado ⇒
  sin `access-control-allow-origin` y bloquea todo (incluso localhost). Diagnóstico:
  `curl -H "Origin: <url>" -D - -o /dev/null <api>/api/auth/setup/status`.
- Vercel monorepo: Root Directory `apps/web` + "Include source files outside of the Root
  Directory"; `apps/web/vercel.json` compila `@erp/shared`.
- Compilar `@erp/shared` antes que api/web (`main` → `dist/`). Cargar nvm en shells no
  interactivas (si no, `node -v` es v12).
- `nest build` (`deleteOutDir` + `incremental`): `tsBuildInfoFile` dentro de `dist/`.
- Render build: `npm ci --include=dev` (prisma/@nestjs/cli/typescript son devDependencies).
- Migración base de Postgres: `prisma migrate diff --from-empty --to-schema-datamodel
  prisma/schema.prisma --script` → `migrations/0_init/`.
- Nunca canalizar `prisma migrate deploy` por `head` (SIGPIPE con el advisory lock → P1002);
  usar `tail`; si pasa, `pg_terminate_backend(pid)`.
- Descargas/impresión protegidas: `downloadFile()` / `openPrintable()` (llevan JWT).
- `pkill -f "next dev"` se mata a sí mismo; usar corchete (`"next d[e]v"`) o PID.
- No hay tests, lint ni CI. OpenCode: `{env:...}` no se interpola en `headers` de MCP.

## Próximos pasos

- Probar el email real por Gmail; asumir recordatorio diario no fiable con Render free.
- Bloque C: app iOS sobre la misma API + push del recordatorio. Añadir tests y lint.
