# MEMORY.md — App de Almacén (project_erp)

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual

- **Fase web cerrada (Bloque A)**: primer arranque (`/setup`), usuarios (solo ADMIN),
  perfil + cambio de contraseña, historial de movimientos (`/movimientos`) y pulido UX
  (foco visible, reduced-motion, estados de error). Builds `shared`/`api`/`web` OK; API
  verificada end-to-end (14/14).
- Publicado en GitHub: `sllorens-cuenca/project-erp` (rama `main`).
- API NestJS :3001 (prefijo `/api`); web Next.js :3000. Datos SQLite dev
  (`apps/api/prisma/dev.db`); seed `admin@almacen.local / admin1234`.
- Email en modo `json` (imprime en consola, **no envía**).
- Tooling: skills en `.agents/skills/`; MCP `github` global (PAT + `X-MCP-Toolsets`);
  `gh` CLI autenticado y como credential helper de git.

## Decisiones (y por qué)

- Monorepo con `packages/shared`: una sola fuente para enums/tipos de api y web. Las
  etiquetas de rol (`USER_ROLE_LABELS`) van ahí, junto a los demás `*_LABELS`.
- SQLite en dev y esquema **portable a PostgreSQL** (sin enums nativos ni tipos de
  Postgres): la máquina no tenía Postgres/Docker/sudo.
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
- Prisma resuelve `file:./dev.db` relativo al schema → BD en `apps/api/prisma/dev.db`.
- Descargas/impresión protegidas: usar `downloadFile()` / `openPrintable()` (llevan JWT).
- `pkill -f "next dev"` se mata a sí mismo si el patrón está en el propio comando; usar
  el truco del corchete (`"next d[e]v"`).
- No hay tests, lint ni CI. OpenCode: `{env:...}` no se interpola en `headers` de MCP.

## Próximos pasos

- Bloque B: publicar (Postgres gestionado + deploy API/web + SMTP real + CORS).
- Bloque C: app iOS sobre la misma API + push del recordatorio diario.
- Añadir tests y lint (hoy no existen).
