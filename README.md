# 📦 App de Almacén (ERP de materiales por obra)

Digitaliza el registro de materiales de almacén vinculados a **clientes** y
**obras/servicios**, con inventario, listados de preparación con estados, envío
automático por email y recordatorio diario.

- **Fase web**: implementada ✅ (Next.js + API NestJS)
- **Fase iOS**: pendiente (consumirá esta misma API)

---

## Estructura del monorepo

```
project_erp/
├── apps/
│   ├── api/          API REST (NestJS + Prisma)
│   └── web/          Interfaz web (Next.js + Tailwind)
└── packages/
    └── shared/       Enums, tipos y utilidades compartidas
```

## Requisitos

- **Node 20/22 LTS**. En esta máquina se instaló vía `nvm`:
  ```bash
  export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
  nvm use 22
  ```
  (nvm se carga automáticamente en nuevas terminales de login por `.bashrc`.)

- **Base de datos**: en desarrollo se usa **SQLite** (no requiere instalar nada).
  Para producción se recomienda **PostgreSQL** (ver "Pasar a PostgreSQL").

## Puesta en marcha

```bash
# 1. Dependencias (desde la raíz del monorepo)
npm install

# 2. Compilar el paquete compartido (lo necesitan api y web)
npm run build -w @erp/shared

# 3. Base de datos: crear esquema y datos de ejemplo
npm run db:migrate      # crea apps/api/dev.db y aplica el esquema
npm run db:seed         # admin, materiales, cliente, obra y listado de ejemplo

# 4. Arrancar API y web (en dos terminales)
npm run dev:api         # http://localhost:3001/api
npm run dev:web         # http://localhost:3000
```

### Credenciales de ejemplo (seed)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | `admin@almacen.local` | `admin1234` |
| Almacenero | `almacen@almacen.local` | `almacen1234` |

> Las credenciales de ejemplo solo se muestran en la pantalla de login en
> **desarrollo** (nunca en producción). Si la base de datos está vacía, la web
> redirige al **primer arranque** (`/setup`) para crear el administrador, sin
> necesidad de ejecutar el seed.

## Funcionalidades

1. **Clientes y carpetas por obra/servicio** — `Cliente → Obra` con tipo de
   servicio (instalación, reparación, aire acondicionado, otro).
2. **Entrada de materiales por comandos o botones** — barra de comandos en el
   listado y botón de movimiento (entrada/salida/ajuste) en materiales.
3. **Listados de materiales preparados** — con cantidades pedidas/preparadas,
   exportación **CSV** e **impresión/PDF**.
4. **Envío automático por email** — al confirmar y enviar: va al **email del
   cliente + copia interna** del almacén.
5. **Recordatorio diario** — correo con los listados pendientes de confirmar,
   a la hora configurable.
6. **Usuarios y perfil** — alta, edición y baja lógica de usuarios (solo ADMIN);
   cada usuario edita su perfil y cambia su contraseña.

### Barra de comandos

Una línea por material (o separadas por `;`):

```
/cobre 25 m
+regleta 10
tuberia 12/14 5
```

- Se toma como cantidad el **último número** de la línea.
- Búsqueda **sin distinguir acentos ni mayúsculas** (`tuberia` → `Tubería 12/14`).
- Prefijos `/` o `+` son opcionales.

### Flujo de estados de un listado

```
BORRADOR → EN_PREPARACION → LISTO → CONFIRMADO → ENVIADO
```

- **CONFIRMADO** descuenta stock (movimientos de salida por cada línea).
- **ENVIADO** genera el email, registra el envío y fija la fecha.

## Configuración

Copia los ejemplos y ajusta:

- `apps/api/.env` (desde `apps/api/.env.example`)
- `apps/web/.env.local` (desde `apps/web/.env.local.example`)

Variables relevantes de la API:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Ruta SQLite o URL de Postgres |
| `JWT_SECRET` | Clave de firma del token |
| `MAIL_TRANSPORT` | `json` (no envía, imprime en consola) o `smtp` |
| `INTERNAL_EMAIL` | Copia interna que recibe listados y recordatorios |
| `REMINDER_HOUR` / `REMINDER_MINUTE` | Hora del recordatorio diario |

**Email real**: en desarrollo `MAIL_TRANSPORT=json` imprime los correos en la
consola de la API. Para enviar de verdad, pon `smtp` y rellena `SMTP_*`
(Gmail/Outlook) o adapta `apps/api/src/mail/mail.service.ts` a un proveedor
transaccional (Resend/SendGrid).

## Pasar a PostgreSQL (producción)

El esquema Prisma evita enums nativos y tipos específicos de SQLite para que la
migración sea directa:

1. En `apps/api/prisma/schema.prisma`, cambia
   `datasource db { provider = "sqlite" }` por `"postgresql"`.
2. Ajusta `DATABASE_URL` a tu conexión (Neon/Supabase/RDS…).
3. Borra `apps/api/prisma/migrations` y regenera:
   ```bash
   npm run db:migrate
   ```

## Roadmap

- [x] **Fase 0** Entorno y monorepo
- [x] **Fase 1** API base (NestJS + Prisma + auth + roles)
- [x] **Fase 2** Clientes y obras
- [x] **Fase 3** Catálogo de materiales + inventario
- [x] **Fase 4** Listados + comandos/botones + estados
- [x] **Fase 5** Export CSV/PDF + email automático
- [x] **Fase 6** Recordatorio diario (email)
- [x] **Fase 7** Web UI
- [x] **Fase 7b** Cierre web: primer arranque (`/setup`), usuarios (ADMIN), perfil
      y cambio de contraseña, historial de movimientos, pulido de UX
- [ ] **Fase 8** App iOS (React Native/Expo o SwiftUI) sobre esta API
- [ ] Push móvil para el recordatorio (cuando exista la app)

## API (resumen)

| Recurso | Endpoints |
|---------|-----------|
| Auth | `POST /api/auth/login`, `GET /api/auth/setup/status`, `POST /api/auth/setup`, `GET /api/auth/me`, `PATCH /api/auth/me`, `PATCH /api/auth/me/password` |
| Usuarios | `GET/POST /api/users`, `GET/PATCH/DELETE /api/users/:id` (ADMIN) |
| Clientes | `GET/POST /api/clients`, `GET/PATCH/DELETE /api/clients/:id` |
| Obras | `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/:id` |
| Materiales | `GET/POST /api/materials`, `GET /api/materials/low-stock`, `GET/PATCH/DELETE /api/materials/:id` |
| Stock | `GET/POST /api/stock-movements` |
| Listados | `GET/POST /api/lists`, `GET /api/lists/pending`, `GET/PATCH/DELETE /api/lists/:id`, `POST /api/lists/:id/items`, `POST /api/lists/:id/commands`, `PATCH /api/lists/:id/status`, `POST /api/lists/:id/confirm`, `POST /api/lists/:id/send`, `GET /api/lists/:id/export`, `GET /api/lists/:id/document` |
| Recordatorios | `GET/PATCH /api/reminders/config`, `GET /api/reminders/history`, `POST /api/reminders/run` |

## Roles

- **ADMIN**: todo, incluida la gestión de usuarios.
- **ALMACENERO**: clientes, obras, materiales, listados, envíos.
- **TECNICO**: consulta y registro de movimientos de stock.
