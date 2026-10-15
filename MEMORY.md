# MEMORY.md — App de Almacén (project_erp)

Memoria entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual

- **Bloques A y B**: fase web completa (setup, usuarios ADMIN, perfil/contraseña, movimientos,
  navbar móvil) y **desplegada**: web `project-erp-vercel.vercel.app` + API
  `erp-api-bojd.onrender.com` + Neon `production`; primer admin creado. Dev: API :3001, web
  :3000, rama `main` (seed `admin@almacen.local / admin1234`).
- GitHub `sllorens-cuenca/project-erp` (`main`). Email prod **Gmail SMTP**, local `json`.
  Tooling `.agents/skills/`, MCP `github`, `gh`. Node 22 vía nvm (el sistema trae 12).

## Decisiones (y por qué)

- Monorepo `packages/shared`: única fuente para enums/tipos y las `*_LABELS`.
- **PostgreSQL (Neon) en dev y prod**, **cadena directa** (sin `-pooler`); sin enums nativos
  (viven en shared). Neon porque las BD free de Render se borran a los 30 días.
- API **Render free** (Frankfurt) + web **Vercel**; Render free se duerme → recordatorio
  diario no fiable hasta pagar.
- Búsquedas con `matches()/normalizeText()` (sin acentos/mayúsculas); guards globales
  (`APP_GUARD`) + `@Public()`/`@Roles()`: seguro por defecto.
- Estados de listado en `lists.service.ts`: `CONFIRMADO` descuenta stock, `ENVIADO` envía
  email real (SMTP).
- Credenciales demo solo si `NODE_ENV !== 'production'`; `PATCH /api/auth/me` reemite el JWT.
- Navbar móvil: barra inferior (Panel·Clientes·Materiales·Listados) + hoja «Más» en
  `components/MobileNav.tsx`; escritorio intacto. Iconos SVG en línea, **`lucide-react`
  pendiente como candidato**.
- `GET /api/health` (público) devuelve `{ ok, commit, uptimeSeconds, timestamp }`; el commit
  sale de `RENDER_GIT_COMMIT` (null en local) → sirve para ver qué código corre en prod.

## Aprendizajes y errores a evitar

- **Vercel**: `NEXT_PUBLIC_API_URL` se incrusta en **build**; si falta, la web usa
  `http://localhost:3001/api` → `NetworkError`. Redesplegar y comprobar el chunk servido.
- **Render/CORS**: `WEB_ORIGIN` = origen exacto de Vercel **sin barra final**. Y la conexión
  Git de Vercel apuntaba a un clon suyo: los pushes no llegaban (Settings → Git).
- **Render no autodesplegó** los últimos pushes (el deploy vivo era `311f882`, a mano). Tras
  hacer push: **Manual Deploy → Clear build cache & deploy** y verificar con `/api/health`.
- **Contrato API↔web**: los `include` de Prisma deben traer los `_count` que pinta la web
  (p.ej. `GET /clients/:id` → `projects[]._count.lists`); la web los lee con `?.`/`?? 0`.
- `nest build` (`incremental`, `deleteOutDir:false`): si `dist/.tsbuildinfo` da el build por
  bueno **no reemite** (`exit=0` con `dist` viejo). Compilar con `rm -rf apps/api/dist`.
- Compilar `@erp/shared` antes que api/web (`main` → `dist/`); nvm en shells no interactivas.
- Render build: `npm ci --include=dev` (devDeps con `NODE_ENV=production`) + `rm -rf` dist.
- Nunca canalizar `prisma migrate deploy` por `head` (SIGPIPE → **P1002**); usar `tail`.
- `downloadFile()`/`openPrintable()` llevan el JWT. `pkill -f "next dev"` se mata a sí mismo:
  usar corchete (`"next d[e]v"`).
- No hay tests, lint ni CI (tampoco script `typecheck`: `nest build` ya valida tipos).

## Próximos pasos

- **Demo en producción**: datos de ejemplo cargados (3 clientes, 2 usuarios, 10 materiales,
  4 obras, 4 listados). Limpiar con `/tmp/opencode/demo-clean.sh` (IDs en
  `/tmp/opencode/demo-ids.json`).
- Probar email real por Gmail. Bloque C: app iOS + push del recordatorio. Tests y lint.
