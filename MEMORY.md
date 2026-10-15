# MEMORY.md — App de Almacén (project_erp)

Memoria entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- Web desplegada: `project-erp-vercel.vercel.app` (Vercel) + `erp-api-bojd.onrender.com` (Render
  free) + Neon `production`. Dev: API :3001, web :3000. Repo `sllorens-cuenca/project-erp` (`main`).
  Node 22 vía nvm (el sistema trae 12). Email prod **Gmail SMTP**, local `json`.
- Últimos cambios: «Listados» → **«Historial»** (`/historial` + redirect 308); tarjetas en móvil
  (Clientes, Historial, Materiales, Movimientos, carpetas de obra y la tabla del registro);
  buscador con sugerencias en Clientes, Materiales y «+ Nuevo registro»; **selector con
  autocompletado** para añadir materiales a un registro (la barra de comandos queda plegada en
  «Modo rápido»). Los textos de la API ya dicen «registro» y están desplegados en Render.
- **Demo en producción**: 4 clientes, 4 obras, 10 materiales, 4 registros; limpiar con
  `/tmp/opencode/demo-clean.sh` (IDs en `/tmp/opencode/demo-ids.json`).

## Decisiones (y por qué)

- Monorepo `packages/shared`: única fuente para enums/tipos y las `*_LABELS`.
- **PostgreSQL (Neon) en dev y prod**, cadena **directa** (sin `-pooler`); las BD free de Render se
  borran a los 30 días. En la BD los enums son texto. Render free se duerme → el recordatorio
  diario no es fiable hasta pagar.
- Búsquedas con `matches()`/`normalizeText()` (sin acentos/mayúsculas); guards globales
  (`APP_GUARD`) + `@Public()`/`@Roles()`: seguro por defecto.
- Estados del registro en `lists.service.ts`: `CONFIRMADO` descuenta stock, `ENVIADO` envía email.
- «Listados» → «Historial» (el documento es un «registro»); `/listados(/:id)` → **308**
  `/historial(/:id)`. El enlace de Materiales a movimientos se llama «Movimientos».
- Navbar móvil: barra inferior (Panel·Clientes·Materiales·Historial) + hoja «Más», iconos SVG en
  línea (`lucide-react` pendiente) — `components/MobileNav.tsx`.
- Móvil: patrón **tarjetas** (tabla `hidden md:block` + lista `md:hidden`) en Clientes, Historial,
  Materiales, Movimientos, carpetas de obra y la tabla del registro (ahí no son enlaces: llevan
  campos). No clicables en Movimientos (sin destino; re-navegar no reinicia el filtro).
- `components/Combobox.tsx`: controlado por el padre, filtra **en memoria** (`normalizeText`), una
  carga por pantalla. **Añadir materiales**: `AddItemForm` = `Combobox` sobre
  `/materials?onlyActive=true` + cantidad/unidad → `POST /lists/:id/items`; avisa si ya estaba
  (la API **acumula**) o si pides más que el stock. `/projects` no admite `?search=`.
- `GET /api/health` (público) da `{ ok, commit, … }` con `RENDER_GIT_COMMIT` → qué código corre.
- Credenciales demo solo si `NODE_ENV !== 'production'`; `PATCH /api/auth/me` reemite el JWT.

## Aprendizajes y errores a evitar

- **Vercel**: `NEXT_PUBLIC_API_URL` se incrusta en **build** (si falta → `localhost` →
  `NetworkError`). Para verificar el deploy: el HTML solo dice «Cargando»; descargar el chunk
  servido (`chunks/app/…/page-*.js`) y buscar un texto nuevo (el minificador escapa los acentos
  como `\xNN`, así que buscar en ASCII).
- **Render**: `WEB_ORIGIN` = origen de Vercel **sin** barra final; Vercel debe apuntar al repo
  correcto (hubo un clon suyo). **No autodespliega**: Manual Deploy → Clear build cache y
  comprobar `/api/health`.
- **Contrato API↔web**: los `include` de Prisma deben traer los `_count` que pinta la web
  (`GET /clients/:id` → `projects[]._count.lists`); la web los lee con `?.`/`?? 0`.
- `nest build` (`incremental`): si `dist/.tsbuildinfo` da el build por bueno **no reemite**
  (`exit=0` con `dist` viejo) → compilar con `rm -rf apps/api/dist`. Compilar `@erp/shared` antes.
- Render build: `npm ci --include=dev` (devDeps con `NODE_ENV=production`) + `rm -rf` dist.
- Nunca canalizar `prisma migrate deploy` por `head` (SIGPIPE → **P1002**); usar `tail`.
- `downloadFile()`/`openPrintable()` llevan el JWT (abrir la URL a mano no). `pkill -f "next d[e]v"`.
- `overflow-hidden` **recorta** la tabla en móvil (no se llegaba a «Quitar»): usar `overflow-x-auto`
  o tarjetas. `redirects()` de Next: `permanent:true` = **308** y conserva la query.
- No hay tests, lint ni CI (tampoco script `typecheck`: `nest build` ya valida tipos).

## Próximos pasos

- Demo en producción ya cargada y borrable (`/tmp/opencode/demo-clean.sh`).
- Tras cada push a `main` que toque la API: Manual Deploy en Render y verificar `/api/health`.
  El renombrado a «registro» ya está desplegado (`GET /api/lists/:id/document`, CSV `registro-<id>.csv`).
