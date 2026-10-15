# MEMORY.md — App de Almacén (project_erp)

Memoria entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- Fase web **desplegada**: web `project-erp-vercel.vercel.app` (Vercel) + API
  `erp-api-bojd.onrender.com` (Render free) + Neon `production`. Dev: API :3001, web :3000.
- Últimos cambios (`main`): «Listados» → **«Historial»** (`/historial` + redirect 308); tarjetas
  en móvil (Clientes, Historial, Materiales, Movimientos, carpetas de obra y la tabla de
  materiales del registro); buscador con sugerencias en Clientes, Materiales y «+ Nuevo
  registro»; y **selector con autocompletado** para añadir materiales a un registro (la antigua
  barra de comandos queda plegada en «Modo rápido»). Los textos de la API ya dicen «registro»
  y **están desplegados en Render** (verificado).
- GitHub `sllorens-cuenca/project-erp` (`main`). Email prod **Gmail SMTP**, local `json`.
  Tooling `.agents/skills/`, MCP `github`, `gh`. Node 22 vía nvm (el sistema trae 12).
- **Demo en producción**: 4 clientes, 4 obras, 10 materiales, 4 registros y usuarios demo;
  limpiar con `/tmp/opencode/demo-clean.sh` (IDs en `/tmp/opencode/demo-ids.json`).

## Decisiones (y por qué)

- Monorepo `packages/shared`: única fuente para enums/tipos y las `*_LABELS`.
- **PostgreSQL (Neon) en dev y prod**, cadena **directa** (sin `-pooler`); Neo porque las BD
  free de Render se borran a los 30 días. En la BD los enums son texto, no tipos nativos.
- API **Render free** + web **Vercel**; Render free se duerme → el recordatorio diario no es
  fiable hasta pagar.
- Búsquedas con `matches()`/`normalizeText()` (sin acentos/mayúsculas); guards globales
  (`APP_GUARD`) + `@Public()`/`@Roles()`: seguro por defecto.
- Estados del registro en `lists.service.ts`: `CONFIRMADO` descuenta stock, `ENVIADO` envía
  email real (SMTP).
- «Listados» → **«Historial»** (el documento es un «registro»); `/listados(/:id)` redirige
  **308** a `/historial(/:id)` conservando la query. El enlace de Materiales a movimientos
  pasó a llamarse «Movimientos» para no colisionar.
- Navbar móvil: barra inferior (Panel·Clientes·Materiales·**Historial**) + hoja «Más»;
  iconos SVG en línea (`lucide-react` sigue pendiente) — `components/MobileNav.tsx`.
- Móvil: patrón **tarjetas** (tabla `hidden md:block` + lista `md:hidden`) en Clientes, Historial,
  Materiales, Movimientos, carpetas de obra y la tabla de materiales del registro (ahí no son
  enlaces: llevan los campos editables). Clicables salvo en Movimientos (no hay destino).
- `components/Combobox.tsx`: buscador controlado por el padre, filtra **en memoria** con
  `normalizeText` (una carga por pantalla, sin petición por tecla); `searchText` para campos
  extra. `/projects` no admite `?search=`.
- **Añadir materiales a un registro**: `AddItemForm` = `Combobox` sobre `/materials?onlyActive=true`
  (+ cantidad y unidad; la pista muestra stock) → `POST /lists/:id/items`. Avisa si el material ya
  estaba (la API **acumula** la cantidad) o si pides más que el stock. Sin cambios de API.
- Credenciales demo solo si `NODE_ENV !== 'production'`; `PATCH /api/auth/me` reemite el JWT.
- `GET /api/health` (público) devuelve `{ ok, commit, uptimeSeconds, timestamp }` con el commit
  de `RENDER_GIT_COMMIT` (null en local) → sirve para ver qué código corre en prod.

## Aprendizajes y errores a evitar

- **Vercel**: `NEXT_PUBLIC_API_URL` se incrusta en **build**; si falta, la web usa
  `http://localhost:3001/api` → `NetworkError`. Redesplegar y comprobar el chunk servido.
- **Render/CORS**: `WEB_ORIGIN` = origen exacto de Vercel **sin barra final**. La conexión Git
  de Vercel apuntaba a un clon suyo: los pushes no llegaban (Settings → Git).
- **Render no autodesplegó** pushes en su día (deploy vivo `311f882`, a mano): verificar con
  `/api/health` y, si no, Manual Deploy → Clear build cache.
- **Contrato API↔web**: los `include` de Prisma deben traer los `_count` que pinta la web
  (p.ej. `GET /clients/:id` → `projects[]._count.lists`); la web los lee con `?.`/`?? 0`.
- `nest build` (`incremental`, `deleteOutDir:false`): si `dist/.tsbuildinfo` da el build por
  bueno **no reemite** (`exit=0` con `dist` viejo). Compilar con `rm -rf apps/api/dist`.
- Compilar `@erp/shared` antes que api/web (`main` → `dist/`); nvm en shells no interactivas.
- Render build: `npm ci --include=dev` (devDeps con `NODE_ENV=production`) + `rm -rf` dist.
- Nunca canalizar `prisma migrate deploy` por `head` (SIGPIPE → **P1002**); usar `tail`.
- `downloadFile()`/`openPrintable()` llevan el JWT (abrir la URL a mano no). `pkill -f "next d[e]v"`.
- `overflow-hidden` **recorta** la tabla en móvil (no se llegaba a «Quitar»): usar `overflow-x-auto`
  o tarjetas. Páginas **client-side**: el HTML estático solo dice «Cargando».
- **Verificar Vercel**: descargar el chunk servido (`chunks/app/…/page-*.js`) y buscar un texto
  nuevo; el minificador escapa los acentos como `\xNN`, así que conviene buscar en ASCII.
- `redirects()` de Next: `permanent:true` = **308**; conserva la query (`?obra=…`).
- No hay tests, lint ni CI (tampoco script `typecheck`: `nest build` ya valida tipos).

## Próximos pasos

- Demo en producción: datos borrables ya cargados; limpiar con `/tmp/opencode/demo-clean.sh`.
- **Render no autodespliega**: tras cada push a `main` que toque la API, Manual Deploy →
  Clear build cache, y verificar `/api/health` (commit). Ya está desplegado el renombrado a
  «registro» (`GET /api/lists/:id/document` y CSV `registro-<id>.csv`).
