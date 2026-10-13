# Despliegue (Bloque B)

Guía para publicar la app en producción. Arquitectura elegida:

| Pieza            | Servicio            | Plan  | Región        |
| ---------------- | ------------------- | ----- | ------------- |
| API (NestJS)     | **Render** (web)    | free  | Frankfurt (UE) |
| Base de datos    | **Neon** PostgreSQL | free  | EU (Frankfurt) |
| Web (Next.js)    | **Vercel**          | free  | fra1          |
| Email            | **Gmail SMTP**      | —     | —             |

> **Aviso importante:** las bases de datos del plan free de Render **se borran a
> los 30 días**, por eso la base de datos vive en **Neon** (no caduca) aunque la
> API sí esté en Render. Además, el plan free de Render **duerme** el servicio
> por inactividad: la primera petición puede tardar ~30-60 s y el recordatorio
> diario no se disparará de forma fiable hasta pasar a un plan de pago.

---

## 0. Requisitos

- Repositorio en GitHub: `sllorens-cuenca/project-erp` (rama `main`).
- Cuentas a crear: [Neon](https://neon.tech), [Render](https://render.com) y
  [Vercel](https://vercel.com) (las tres permiten entrar con GitHub).
- Una cuenta de **Gmail** con **verificación en 2 pasos** activada (para generar
  la contraseña de aplicación del SMTP).
- Node 22 en local, cargado con nvm:
  `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`.

---

## 1. Base de datos en Neon (dev y prod)

1. Crea un proyecto `erp-almacen` en la región **Europe (Frankfurt /
   eu-central-1)**. Neon crea la rama `main` con la base `neondb`.
2. Crea una **rama `production`** desde `main` (branches → New branch).
3. Para cada rama (`main` y `production`) copia la **cadena de conexión
   directa** (Connect → *Direct connection*, la que **no** lleva `-pooler`).
   Tiene este aspecto:
   ```
   postgresql://neondb_owner:XXXX@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   - Rama `main` → entorno **local** (desarrollo).
   - Rama `production` → entorno **producción** (Render).

> Usamos la conexión directa porque la API es un proceso persistente; no
> necesitamos el pooler (`-pooler`) ni `directUrl`.

---

## 2. Desarrollo local (ahora con Neon)

En `apps/api/.env` (fichero ignorado por git, no se sube):

```dotenv
DATABASE_URL="<cadena directa de la rama main>"
```

Y ejecuta:

```bash
npm run build -w @erp/shared
npm run db:deploy      # aplica las migraciones a Neon
npm run db:generate    # genera el cliente Prisma
npm run db:seed        # datos de ejemplo (opcional)
npm run dev:api
```

Y en otra terminal: `npm run dev:web`.

> Si `db:deploy` falla con "migration not found", ejecuta primero
> `npm run db:migrate` (Prisma crea la base y aplica la migración `0_init`).

El antiguo SQLite (`apps/api/prisma/dev.db`) deja de usarse.

---

## 3. API en Render

1. Render → **New +** → **Blueprint** → conecta el repo
   `sllorens-cuenca/project-erp`. Render leerá `render.yaml`.
2. Rellena las variables marcadas como `sync: false`:

   | Variable         | Valor                                                        |
   | ---------------- | ------------------------------------------------------------ |
   | `DATABASE_URL`   | cadena directa de la rama **production** de Neon             |
   | `WEB_ORIGIN`     | de momento `http://localhost:3000` (se cambia en el paso 5)  |
   | `MAIL_FROM`      | `Almacen <tu-cuenta@gmail.com>`                              |
   | `INTERNAL_EMAIL` | correo interno que recibe copia de los listados             |
   | `SMTP_USER`      | `tu-cuenta@gmail.com`                                        |
   | `SMTP_PASS`      | contraseña de aplicación de Gmail (16 caracteres)            |

   `JWT_SECRET` lo genera Render automáticamente.
3. Aplica el Blueprint. El build tarda unos minutos:
   `npm ci` → compila `@erp/shared` → `prisma generate` → `nest build`; y al
   arrancar ejecuta `prisma migrate deploy` (crea las tablas) y arranca la API.
4. Anota la URL del servicio, p. ej. `https://erp-api-xxxx.onrender.com`.
5. Comprueba que responde:
   ```bash
   curl https://erp-api-xxxx.onrender.com/api/auth/setup/status
   # → {"configured":false}
   ```

---

## 4. Web en Vercel

1. Vercel → **Add New…** → **Project** → importa `project-erp`.
2. En **Root Directory** selecciona **`apps/web`**.
3. Activa **"Include source files outside of the Root Directory in the Build
   Step"** (necesario para compilar `@erp/shared` del monorepo).
4. Framework Preset: **Next.js**. Los comandos de instalación/build ya vienen
   de `apps/web/vercel.json` (`npm ci` en la raíz y build de `@erp/shared` +
   Next).
5. Añade la variable de entorno:
   ```
   NEXT_PUBLIC_API_URL = https://erp-api-xxxx.onrender.com/api
   ```
6. **Deploy**. Anota la URL, p. ej. `https://project-erp-xxxx.vercel.app`.

---

## 5. Conectar web ↔ API (CORS)

En Render, edita la variable `WEB_ORIGIN` con la URL de Vercel:

```
WEB_ORIGIN = https://project-erp-xxxx.vercel.app
```

Guarda: Render redesplegará solo. (Para permitir también los *previews* de
Vercel, puedes poner varias URLs separadas por coma.)

---

## 6. Primer administrador

1. Abre la web e ve a `/setup`.
2. Rellena nombre, correo y contraseña del administrador. Ese usuario se crea
   **solo si la base de datos no tiene ningún usuario**.
3. Inicia sesión. Desde `/perfil` podrás cambiar tus datos, y desde `/usuarios`
   (solo ADMIN) crear el resto de cuentas.

---

## 7. Probar el email

1. Asegúrate de que el remitente y la cuenta SMTP coinciden (`MAIL_FROM` =
   `SMTP_USER`, ambos tu Gmail).
2. En la web, ve a **Recordatorios** y pulsa **Enviar ahora** (o confirma un
   listado para que se envíe al cliente con copia a `INTERNAL_EMAIL`).
3. Comprueba que llega el correo. Gmail permite ~500 envíos/día.

---

## Verificación rápida

- [ ] `GET /api/auth/setup/status` responde `{"configured":true}`.
- [ ] Login en la web funciona.
- [ ] Crear cliente, material y listado; confirmar descuenta stock.
- [ ] Exportar/Imprimir listado (adjunta el JWT).
- [ ] Llega el correo a `INTERNAL_EMAIL`.
- [ ] `git push` a `main` redespliega API (Render) y web (Vercel).

## Actualizaciones y migraciones

- Nuevos cambios: `git push` a `main` → Render y Vercel redespliegan solos.
- Nueva migración: en local `npm run db:migrate -- --name <nombre>`, haz commit
  de `apps/api/prisma/migrations/**`; Render ejecutará `prisma migrate deploy`
  al arrancar.

## Limitaciones conocidas (aceptadas)

- **Render free** se duerme: primera petición lenta y **recordatorio diario no
  fiable**. Se resolverá pasando el servicio a un plan de pago.
- **Neon free** suspende el cómputo por inactividad (arranque ~0,5 s) y tiene
  ~0,5 GB de almacenamiento.
- **Gmail**: límite diario y el remitente será tu dirección de Gmail.
- Sin entorno de *staging* por ahora.

## Nunca en el repositorio

Contraseñas, cadenas de conexión, `JWT_SECRET` y la contraseña de aplicación de
Gmail van **solo** en `.env` (local, ignorado por git) o en el panel de Render.
