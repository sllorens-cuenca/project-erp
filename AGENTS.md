# AGENTS.md

App de almacén (ERP de materiales por cliente/obra). Monorepo **npm workspaces**.
Producto, funcionalidades y catálogo de endpoints están en `README.md` — no los
dupliques aquí; este archivo es solo contexto operativo que no es obvio.

## Entorno (gotcha crítico)

- El `node` del sistema es **v12** (EOL). El proyecto requiere **>=20**.
- Carga nvm **en cada shell no interactiva** antes de cualquier comando:
  ```bash
  export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
  ```
  Verifica con `node -v` (debe ser `22.x`). `.bashrc` carga nvm solo en shells de
  login, así que en scripts/tooling `node` será v12 y fallará de forma confusa.

## Comandos

- `npm install` (desde la raíz).
- **Compila `@erp/shared` antes que api/web**: su `main` apunta a `dist/`, que no
  se versiona. `npm run build -w @erp/shared` (o `-w @erp/shared dev` en watch).
- API: `npm run dev:api` (:3001, prefijo global `/api`). Web: `npm run dev:web` (:3000).
- Build: `npm run build -w @erp/api` · `npm run build -w @erp/web`.
- DB: `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`.
- **No hay tests ni lint ni CI** (sin jest/vitest/eslint/.github). No inventes
  `npm test`. Verifica con `npm run build -w <paquete>` y `curl` a la API.

## Monorepo

- `apps/api` = NestJS + Prisma · `apps/web` = Next.js App Router · `packages/shared` = enums/tipos.
- `apps/web` importa `@erp/shared` desde su `dist` compilado
  (`transpilePackages: ['@erp/shared']`). **Recompila shared tras tocarlo.**

## Prisma / base de datos

- Dev = **SQLite**. `.env` en `apps/api/.env` (`DATABASE_URL="file:./dev.db"`).
- La BD está en **`apps/api/prisma/dev.db`** (Prisma resuelve rutas SQLite
  relativas al schema, no al cwd). Los scripts `prisma:*` corren en el workspace api.
- **Sin enums nativos**: los enums viven en `packages/shared/src/enums.ts` y en la
  BD son `String`. Al añadir un valor, edítalo en shared (no en `schema.prisma`).
- Pasar a PostgreSQL: `provider = "postgresql"` + **borrar `apps/api/prisma/migrations`** y regenerar.

## Convenciones de la API (`apps/api`)

- Prefijo global `/api` y CORS desde `WEB_ORIGIN` (en `src/main.ts`).
- **Auth global**: `JwtAuthGuard` + `RolesGuard` se registran con `APP_GUARD`; todo
  endpoint está autenticado por defecto. Usa `@Public()` para abrir y
  `@Roles(UserRole.X)` para restringir.
- **Búsquedas de texto**: no uses `contains` de Prisma; SQLite no normaliza acentos.
  Usa `matches()` / `normalizeText()` de `src/common/utils/text.ts`.
- **Estado de listados**: transiciones y efectos en `src/lists/lists.service.ts`
  (`TRANSITIONS`). `CONFIRMADO` descuenta stock (movimientos SALIDA en transacción);
  `ENVIADO` envía email. Nunca cambies el estado por SQL/Prisma directo.
- **Barra de comandos**: parser en `src/lists/command.parser.ts` (cantidad = último
  número de la línea; prefijos `/` y `+` opcionales).
- **Recordatorio diario**: `src/reminders/reminders.service.ts` usa
  `@Cron(EVERY_MINUTE)` comparando la hora de `JobConfig` (id `reminder`) y
  deduplica por día.
- **Email**: por defecto `MAIL_TRANSPORT=json` → NO envía, solo imprime en consola.

## Web (`apps/web`)

- Sesión **client-side**: token JWT en `localStorage` (`lib/api.ts`, `lib/auth.tsx`).
  No hay cookies ni sesión SSR.
- URL de API vía `NEXT_PUBLIC_API_URL` (`lib/api.ts`).
- Para descargas/impresión protegidas usa `downloadFile()` / `openPrintable()`
  (adjuntan el JWT). Abrir la URL de export en una pestaña nueva **no** lleva token.

## Gotcha de build (API)

- `apps/api/tsconfig.build.json` fija `tsBuildInfoFile: "./dist/.tsbuildinfo"` a
  propósito. **No lo muevas fuera de `dist`**: con `deleteOutDir` + `incremental`,
  un tsbuildinfo fuera de dist deja `dist/` incompleto (faltan ficheros).

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales).

## Limite
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea.
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ⚠ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.