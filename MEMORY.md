# MEMORY.md — App de Almacén (project_erp)

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no
aporte.

## Estado actual

- Fase web funcionando: monorepo npm workspaces (`apps/api`, `apps/web`, `packages/shared`).
- API NestJS en :3001 (prefijo `/api`); web Next.js en :3000.
- Funcionalidades completas: clientes→obras/servicios, materiales con stock y mínimos,
  listados con barra de comandos y flujo de estados, email automático, recordatorio diario.
- Datos en SQLite de desarrollo (`apps/api/prisma/dev.db`). Seed: `admin@almacen.local / admin1234`.
- Email en modo `json` (imprime en consola, **no envía**).
- Tooling: 10 skills en `.agents/skills/` + `skills-lock.json`; MCP `github` remoto en `~/.config/opencode/opencode.json` (global), pendiente de autenticar.

## Decisiones (y por qué)

- Monorepo con `packages/shared`: una sola fuente para los enums/tipos que usan api y web.
- SQLite en dev y esquema **portable a PostgreSQL** (sin enums nativos ni tipos de Postgres):
  la máquina no tenía Postgres/Docker/sudo y así no se bloquea el desarrollo.
- `matches()/normalizeText()` en vez de `contains` de Prisma: SQLite no normaliza acentos
  ("tuberia" no encontraba "Tubería").
- Guards globales (`APP_GUARD`) + `@Public()` / `@Roles()`: seguro por defecto.
- Estados de listado con efectos centralizados en `lists.service.ts`
  (`CONFIRMADO` descuenta stock en transacción, `ENVIADO` envía email).
- Recordatorio con `@Cron(EVERY_MINUTE)` comparando la hora de `JobConfig`: cambiar la hora
  sin reiniciar el proceso.
- Email tras `MAIL_TRANSPORT` (`json`/`smtp`): desarrollo sin credenciales reales.
- Node 22 vía nvm (el sistema trae v12): requisito del stack moderno.
- Aprovechar las skills de Vercel: guías de React/Next aplicables ya y de RN/Expo para la Fase iOS.

## Aprendizajes y errores a evitar

- `nest build` con `deleteOutDir` + `incremental`: el `tsBuildInfoFile` debe estar dentro de
  `dist/` o el build deja `dist/` incompleto (faltan ficheros).
- Compilar `@erp/shared` antes que api/web: su `main` apunta a `dist/`, que no se versiona.
- En shells no interactivas hay que cargar nvm; si no, `node -v` es v12.
- Prisma resuelve `file:./dev.db` relativo al schema → la BD está en `apps/api/prisma/dev.db`.
- Descargas/impresión protegidas requieren `downloadFile()` / `openPrintable()`: abrir la URL
  de export en pestaña nueva no lleva el JWT.
- No hay tests, lint ni CI configurados.

## Próximos pasos

- Fase 8: app iOS (React Native/Expo o SwiftUI) sobre la misma API.
- Push móvil para el recordatorio diario.
- Configurar SMTP/proveedor transaccional real y decidir hosting (Postgres gestionado + deploy).
- Añadir tests y lint (hoy no existen).
- Decidir si se versionan `.agents/skills/` y `skills-lock.json` (hoy sin commitear).
