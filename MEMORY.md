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

## Aprendizajes y errores a evitar

- **Vercel**: `NEXT_PUBLIC_API_URL` se incrusta en **build**; si falta, la web usa
  `http://localhost:3001/api` → `NetworkError when attempting to fetch resource`. Hay que
  **redesplegar** y comprobar que no quede `localhost` en el chunk servido.
- **Render/CORS**: `WEB_ORIGIN` = origen exacto de Vercel **sin barra final**; mal formado ⇒
  sin `access-control-allow-origin` (bloquea todo). Diagnóstico: `curl -H "Origin: <url>"
  -D - -o /dev/null <api>/api/auth/setup/status`.
- **Vercel Git**: la conexión apuntaba a un clon suyo y los pushes no llegaban (Settings →
  Git); cambiarlo no relanza el build, hay que lanzarlo. (El resto de la config de despliegue
  está en `DEPLOY.md`.)
- Compilar `@erp/shared` antes que api/web (`main` → `dist/`); nvm en shells no interactivas.
- `nest build` (`deleteOutDir` + `incremental`): `tsBuildInfoFile` dentro de `dist/`.
- Render build: `npm ci --include=dev` (devDeps con `NODE_ENV=production`).
- Nunca canalizar `prisma migrate deploy` por `head` (SIGPIPE → **P1002**); usar `tail`.
- `downloadFile()`/`openPrintable()` llevan el JWT. `pkill -f "next dev"` se mata a sí mismo:
  usar corchete (`"next d[e]v"`).
- No hay tests, lint ni CI. OpenCode: `{env:...}` no se interpola en `headers` de MCP.

## Próximos pasos

- **Demo en producción**: datos de ejemplo cargados (3 clientes, 2 usuarios, 10 materiales,
  4 obras, 4 listados). Limpiar con `/tmp/opencode/demo-clean.sh` (IDs en
  `/tmp/opencode/demo-ids.json`). Navbar móvil ya desplegado; Vercel redespliega solo al
  hacer push a `main`.
- Probar email real por Gmail. Bloque C: app iOS + push del recordatorio. Tests y lint.
