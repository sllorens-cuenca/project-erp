# Plan 002 — Dictado por voz para añadir materiales

Spec: `specs/002-dictado-voz-materiales/spec.md` (aprobada) · Fecha: 2026-10-28

## Resumen de la solución

Se añade dictado por voz con Web Speech API en **tres zonas únicamente** (RF-1): 
1. Formulario de un material en el detalle de un registro (`apps/web/app/historial/[id]/page.tsx` → `AddItemForm`)  
2. Modo rápido en el detalle de un registro (`CommandBar`)  
3. Formulario de alta de materiales en la ficha de una obra (`apps/web/components/NuevoRegistroObraForm.tsx` - aunque este formulario solo crea el registro; según RF-7 el dictado rellena ese formulario sin crear el registro)

Toda la lógica **pura** (conversión de numerales ES, reparto nombre/cantidad/unidad, traducción de unidades habladas) vive en módulos puros con `hoy` como parámetro **no aplicable** (estas funciones no dependen de fecha). Se añaden tests con `node --test` para lógica pura (RNF-12).

Cambios **aditivos** que afectan también al uso sin dictado (RNF-8): normalización del texto del modo rápido (conversión de numerales + unidad dictada escrita como código), conservación de líneas que fallan al añadir (RF-54), y admisión de cantidades > 0 con decimales menores que 1 (RF-55).

## Archivos y responsabilidades

### API

| Archivo | Cambio | RF cubiertos |
|---|---|---|
| `apps/api/src/lists/command.parser.ts` | Añadir conversión de numerales ES (RF-41 a RF-52) antes de interpretar, traducción de unidades habladas a código cuando van detrás de cantidad (RF-38), regla "un/una" (RF-50). Mantener reglas existentes (última cifra como cantidad, prefijos / +, ; y saltos de línea). | RF-38, RF-40, RF-41-RF-52, RNF-8 |
| `apps/api/src/lists/lists.service.ts` | Al añadir varias líneas y alguna falle, conservar solo las que fallaron en el área (RF-54). Cambiar validación de cantidad a > 0 (acepta decimales < 1) (RF-55). | RF-54, RF-55, RNF-8 |
| `apps/api/src/materials/*` | Sin cambios estructurales. La búsqueda sigue siendo la actual. | - |

### Web

| Archivo | Cambio | RF cubiertos |
|---|---|---|
| `apps/web/app/historial/[id]/page.tsx` | Añadir dictado a `AddItemForm` y a `CommandBar`. Gestionar estados de escucha, aviso de privacidad, permisos, silencio 2s. | RF-1-RF-4, RF-7-RF-8, RF-15-RF-31, RF-32-RF-40 |
| `apps/web/components/NuevoRegistroObraForm.tsx` | Añadir dictado al formulario (rellena sin crear registro). | RF-1, RF-7, RF-32-RF-38 |
| `apps/web/components/Combobox.tsx` | Sin cambios funcionales. Usado por AddItemForm para selección de material. | - |
| `apps/web/lib/permissions.ts` | Sin cambios. Ya existe lógica de permisos. | RF-3 |
| `apps/web/lib/voice/*` (nuevos) | Módulos puros para lógica de voz: `numerals.ts` (conversión ES), `units.ts` (tabla hablada), `parse.ts` (reparto nombre/cantidad/unidad), `storage.ts` (recordatorio privacidad). | RF-34, RF-37-RF-52 |
| `apps/web/lib/voice/webspeech.ts` (nuevo) | Wrapper sobre Web Speech API con manejo de estados, silencio, permisos. Sin lógica de negocio pura. | RF-9-RF-27, RNF-1-RN-3 |
| `apps/web/components/VoiceDictation.tsx` (nuevo) | Componente reutilizable para las 3 zonas con estados, aviso, accesibilidad. | RF-1-RF-4, RF-9-RF-14, RF-17-RN-3, RNF-3, RNF-6, RNF-7 |
| `apps/web/lib/command.ts` (modificar) | Usar lógica pura de conversión antes de interpretar (también afecta a modo rápido tecleado). | RF-38, RF-40, RF-46, RNF-8 |

### Tests

| Archivo | Cambio | RF cubiertos |
|---|---|---|
| `apps/web/lib/voice/numerals.test.ts` (nuevo) | Tests `node --test` para conversión de numerales | RF-41-RF-52 |
| `apps/web/lib/voice/parse.test.ts` (nuevo) | Tests `node --test` para reparto nombre/cantidad/unidad | RF-32, RF-47-RF-48, RF-50 |
| `apps/web/lib/voice/units.test.ts` (nuevo) | Tests `node --test` para traducción unidades | RF-37-RF-38 |
| `package.json` (raíz) | Añadir script de tests para lógica pura con `node --test` (convención coherente). Ver RNF-12. | RNF-12 |

## Funciones puras: firma/contrato

Todas las funciones puras **no dependen de fecha/hora**. No reciben parámetro `hoy`. Son puramente deterministas.

### `apps/web/lib/voice/numerals.ts`

```ts
/**
 * Convierte cantidades dichas con palabras en español a cifra.
 * Solo convierte la última expresión numérica de la línea si está al final o seguida de palabra de unidad.
 * Aplica a todo el texto del modo rápido (RF-41 a RF-52).
 */
export function convertNumeralsES(input: string): string {
  // ...
}

/**
 * Extrae y convierte solo la última expresión numérica válida para cantidad
 */
export function convertLastNumericExpression(line: string): { text: string; converted: boolean } {
  // ...
}
```

**Contrato:**
- Entrada: string en español
- Salida: string con numerales convertidos a cifras (sin separador de miles, coma decimal)
- Solo última expresión numérica al final o seguida de palabra de unidad (RF-47)
- "un/una" solo como artículo si única expresión y no forma parte de "un millón"/"un cuarto" (RF-50)
- Fracciones solo en posición de cantidad (RF-43)
- Cifras ya en dígitos se conservan (RF-45)
- Expresiones no reconocidas se dejan tal cual (RF-51)
- Formato: 1500, 2,5 (RF-49)

### `apps/web/lib/voice/units.ts`

```ts
/**
 * Tabla de unidades habladas cerrada (RF-97, RF-100)
 */
export const SPOKEN_UNITS: Record<string, string> = {
  // UD
  ud: 'UD', uds: 'UD', unidad: 'UD', unidades: 'UD',
  // M
  m: 'M', metro: 'M', metros: 'M',
  // M2
  m2: 'M2', 'metro cuadrado': 'M2', 'metros cuadrados': 'M2',
  // KG
  kg: 'KG', kilo: 'KG', kilos: 'KG',
  // L
  l: 'L', litro: 'L', litros: 'L',
  // ROLLO
  rollo: 'ROLLO', rollos: 'ROLLO',
  // CAJA
  caja: 'CAJA', cajas: 'CAJA',
  // PAQUETE
  paquete: 'PAQUETE', paquetes: 'PAQUETE',
};

/**
 * Palabras que se reconocen pero NO se traducen (RF-100)
 */
export const NON_TRANSLATABLE_UNITS = new Set(['ml', 'metro lineal', 'metros lineales']);

/**
 * Traduce unidad hablada a código. Prevalece sobre autoselección/elección manual (RF-37)
 */
export function translateSpokenUnit(word: string): string | null {
  // Normaliza (tildes, mayúsculas) y busca en tabla
}
```

### `apps/web/lib/voice/parse.ts`

```ts
/**
 * Reparte transcripción en nombre, cantidad y unidad (regla RF-47)
 * Usado tanto en formulario como en modo rápido
 */
export interface ParsedMaterial {
  name: string;      // lo anterior a la cantidad
  quantity: string | null; // última expresión numérica (convertida si aplica)
  unit: string | null;     // palabra de unidad detrás de cantidad (original o traducida)
  raw: string;
}

export function parseMaterialLine(line: string): ParsedMaterial {
  // 1. Aplicar conversión de numerales (solo última expresión válida)
  // 2. Identificar última expresión numérica
  // 3. Si hay palabra de unidad detrás, extraerla
  // 4. Nombre = todo lo anterior
}

/**
 * Para formulario: aplica reglas RF-32, RF-34, RF-35, RF-37
 */
export function parseForForm(transcript: string): {
  name: string;
  quantity: string | null;
  spokenUnit: string | null; // palabra hablada si existe
}
```

**Contrato:**
- Cantidad = última expresión numérica (RF-47, RF-94)
- Lo que va detrás de cantidad: si es palabra de unidad → unidad, si no → no forma parte del nombre (RF-94)
- "un/una" al inicio sin otra cantidad → unidad (RF-50)
- Coincidencia exacta para autoselección: nombre sin tildes/mayúsculas/espacios múltiples (RF-116, RF-218)

### `apps/web/lib/voice/storage.ts`

```ts
const PRIVACY_KEY = 'voice_privacy_accepted';

export function hasAcceptedPrivacy(): boolean {
  try { return localStorage.getItem(PRIVACY_KEY) === 'true'; } catch { return false; }
}

export function acceptPrivacy(): void {
  try { localStorage.setItem(PRIVACY_KEY, 'true'); } catch { /* ignorar */ }
}
```

## Pseudocódigo de lo arriesgado

### Conversión de numerales (RF-41 a RF-52)

```text
function convertNumeralsES(input):
  // Normalizar espacios
  text = input.replace(/\s+/g, ' ').trim()
  
  // Procesar por líneas en modo rápido? RF-46 dice "aplica siempre al texto del modo rápido"
  // Pero función pura trabaja sobre string; el caller decide por líneas
  
  // Encontrar candidatas a cantidad: última expresión numérica válida
  // Expresión válida si está al final o seguida de palabra de unidad (RF-47)
  
  candidates = findNumericExpressions(text) // todas las que parezcan números en palabras
  if (candidates.length === 0) return text
  
  last = candidates[candidates.length - 1]
  // Verificar si es válida (última y al final o seguida de unidad)
  if (!isValidQuantityPosition(text, last)) return text
  
  // Intentar convertir
  num = parseSpanishNumber(last.match) // maneja veintiuno, cientos, miles, millones, cien/ciento, coma, fracciones
  if (!num.recognized) return text // RF-51
  if (num.value === 0) {
    // RF-475: convertir a 0 pero validación posterior lo rechaza
  }
  
  // Reemplazar solo esa ocurrencia
  return replaceExpression(text, last, formatNumber(num.value)) // sin separador miles, coma decimal
```

**Casos complejos:**
- "veintiún", "veintiuna" (apócope) (RF-246, RF-450)
- "doscientos"/"doscientas", "quinientos"/"quinientas" (género) (RF-246, RF-450)
- "mil" solo = 1000 (RF-247)
- "cien" y "ciento" = 100 (RF-248, RF-449)
- "un millón" vs "un tornillo" (RF-247, RF-271, RF-455)
- "medio", "un cuarto", "tres cuartos", "y medio", "y cuarto" solo en posición de cantidad (RF-252, RF-253, RF-464)
- "25 y medio" mezcla cifra+fracción (RF-255, RF-458)
- "dos coma cinco" (RF-250, RF-460)

### Reparto nombre/cantidad/unidad (RF-32, RF-47)

```text
function parseMaterialLine(line):
  normalized = convertNumeralsES(line)
  
  // Buscar última expresión numérica
  match = findLastNumber(normalized)
  if (!match) return { name: normalized.trim(), quantity: null, unit: null }
  
  before = normalized.slice(0, match.index).trim()
  after = normalized.slice(match.index + match[0].length).trim() // puede tener unidad
  
  // Extraer unidad si está en after y es palabra de unidad
  unit = null
  if (after) {
    // Ver si first token(s) forman unidad
    unitWord = extractUnitWord(after) // busca en SPOKEN_UNITS o NON_TRANSLATABLE
    if (unitWord) {
      unit = translateSpokenUnit(unitWord) // puede ser null si no traducible
      // El resto después de unidad queda fuera? RF-94 dice "lo que va detrás deja de ser nombre"
      // "cinta dos rollos 5 metros extra" - solo "metros" es unidad? Según RF-470 ejemplo "cobre veinticinco metros" pasa a tener unidad
      // Interpretación: primera palabra/token de unidad detrás de cantidad se toma como unidad
    }
  }
  
  // Aplicar regla "un/una" RF-50
  name = applyUnUnaRule(before, match)
  
  return { name, quantity: match[0], unit }
```

### Traducción unidad en modo rápido (RF-38)

```text
// En command.parser o en normalización previa
function translateUnitInLine(line):
  // Después de conversión de numerales, buscar patrón: número + espacio + palabra_unidad
  // Reemplazar palabra_unidad por código
  // Solo si está en SPOKEN_UNITS
  // "regleta diez cajas" -> tras conversión "regleta 10 cajas" -> "regleta 10 CAJA"
```

### Web Speech API wrapper (RF-9-RF-27)

```text
// webspeech.ts - sin lógica pura
- Solicitar permiso solo tras aceptar aviso (RF-16)
- Idioma es-ES (RNF-1)
- Escuchar con reconocimiento continuo? RNF-10 dice "sin exigir resultados provisionales ni escucha continua"
- Detectar silencio 2s (RF-20)
- Tratar cierre del navegador como silencio (RF-21)
- Máximo una escucha activa globalmente por campo/contexto (RF-23, RF-25)
- Detener al salir de pantalla o al plegar modo rápido (RF-8, RF-24)
- Deshabilitar durante alta en curso (RF-26)
```

## Interfaz: estados/textos exactos (RNF-7)

**Textos obligatorios:**
- "Dictar"
- "Detener"
- "Escuchando…"
- "Dictado detenido"
- "Qué pasa con mi voz"
- "Aceptar y dictar"
- "Ahora no"
- "Se ha entendido"
- Más mensajes de error RF-56 a RF-63

**Componente `VoiceDictation`:**
- Botón con icono de micrófono + texto "Dictar" / "Detener"
- Enlace "Qué pasa con mi voz"
- Estado "Escuchando…" visible mientras escucha activa
- Diálogo de aviso de privacidad con título, texto, "Aceptar y dictar", "Ahora no", foco inicial, Escape cierra (= "Ahora no")
- Mostrar "Se ha entendido: ..." en formulario mientras hay resultado (RF-33)
- Mensajes de error en español sin detalles técnicos

**Tres zonas:**
1. **Detalle registro - Formulario añadir material** (`AddItemForm`): junto al selector/buscador o botón añadir
2. **Detalle registro - Modo rápido** (`CommandBar`): **dentro** de la zona desplegable del modo rápido; si plegada no hay dictado, si se pliega durante sesión se cierra conservando texto (RF-8)
3. **Ficha obra - Añadir materiales** (`NuevoRegistroObraForm`): en ese formulario, rellena sin crear registro (RF-7)

**Accesibilidad (RNF-3):**
- Botón accesible: `aria-label="Dictar materiales"` / `aria-label="Detener dictado"`
- Cambio de estado anunciado
- Operable con teclado
- No solo color (lleva texto)
- Mínimo 44×44 px en táctil
- Diálogo con foco, Escape, roles ARIA

## Decisiones justificadas con alternativa descartada

1. **Lógica pura en `apps/web/lib/voice/*` vs API**  
   - **Elegido:** Lógica pura en web (y también usar en API para consistencia con RNF-8 "también afecta al uso sin dictado").  
   - **Razón:** Conversión debe aplicarse también a lo tecleado en modo rápido (RF-46). Si solo estuviera en web, al pegar/teclear en API no se normalizaría. Mejor tener lógica compartible; pero monorepo tiene `packages/shared`.  
   - **Alternativa descartada:** Solo en API. Rechazada porque RF-46 dice "aplica siempre al texto del modo rápido, venga del micrófono o del teclado" - el texto tecleado se interpreta en cliente? Revisar: `CommandBar` envía el texto al backend vía `POST /lists/:id/items/bulk` o interpretación? Mirar cómo funciona hoy. Pero la regla dice "aplica siempre al texto del modo rápido" - probablemente normalizar en cliente antes de enviar O normalizar en API. Dado que RNF-8 dice "cambios acotados que TAMBIÉN afectan al uso sin dictado", debe funcionar en ambos lados. Implementar en API (command.parser) y también asegurar que cliente envía texto ya normalizado? O normalizar en ambos. Más seguro normalizar en API (fuente única de verdad para interpretación). También añadir helpers puros reutilizables.  
   - **Decisión final:** Implementar lógica pura en `packages/shared/src/voice/*` (compartida) para evitar duplicación, o en ambos sitios. Pero hay que compilar shared. Revisar estructura: `packages/shared` tiene enums. Añadir ahí lógica pura es razonable. O simplemente duplicar con tests que garanticen paridad? Mejor poner en shared para reutilizar entre API y web.

2. **Web Speech API vs servicio propio**  
   - **Elegido:** Web Speech API del navegador (RNF-5, RNF-9).  
   - **Razón:** No maneja audio, no envía a servidores propios, cumple requisitos.  
   - **Alternativa descartada:** Transcripción server-side con Whisper/Google STT. Rechazada por RNF-9 (no añadir servicios propios ni de pago, no enviar a servidores distintos salvo los que ya usa el navegador) y complejidad.

3. **Componente reutilizable vs duplicado**  
   - **Elegido:** `VoiceDictation.tsx` componente reutilizable con props para callbacks y contexto (formulario/modo rápido).  
   - **Razón:** DRY, consistencia de estados/textos/accesibilidad.  
   - **Alternativa descartada:** Implementar por separado en cada zona. Rechazada por riesgo de inconsistencias.

4. **Almacenamiento aviso privacidad**  
   - **Elegido:** `localStorage` (RF-12, RF-155).  
   - **Razón:** Simple, por navegador.  
   - **Alternativa descartada:** Cookie, servidor por usuario. Rechazada por RNF-4 (se recuerda en navegador, no sincroniza entre dispositivos/cuentas) y RF-511 (gestión por usuario/ cuenta fuera de alcance).

5. **Conversión numérica: solo última expresión**  
   - **Elegido:** RF-47 estricto.  
   - **Razón:** Evita convertir "tubería de dos pulgadas" (RF-264, RF-465).  
   - **Alternativa descartada:** Convertir todas las expresiones numéricas. Rechazada por casos límite.

6. **Cantidad mínima > 0**  
   - **Elegido:** RF-55 cambiar validación a > 0.  
   - **Razón:** Permitir 0,5 y 0,25.  
   - **Alternativa descartada:** Mantener >= 1. Rechazada explícitamente.

## Estrategia de tests con `node --test`

**Convención (RNF-12):** Añadir soporte para tests con Node.js nativo `node --test`. No hay jest/vitest hoy. Usar TypeScript con `tsx` o compilar tests. Ver estructura del proyecto.

**Cómo ejecutar:**
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && node -v  # debe ser 22.x
npm test  # o node --test según configuración
```

**Configuración a añadir:**
- En `package.json` raíz: `"test": "node --test"` o con glob `**/*.test.ts`
- Para TypeScript: usar `node --loader ts-node/esm` o `tsx --test`. Ver qué está disponible. Revisar package.json raíz.
- Añadir dependencia dev si necesario: `tsx` (ligero). O usar `ts-node`.
- Tests solo para lógica pura en `apps/web/lib/voice/*.test.ts` y/o `packages/shared/src/voice/*.test.ts`

**Tabla de ejemplos obligatoria (RNF-370 a RF-375):**

**numerals.test.ts:**
- Unidades: "uno", "dos" ... "nueve"
- Veintiuno-veintinueve y variantes: "veintiuno", "veintiún", "veintiuna", "veintinueve"
- Centenas masculino/femenino: "doscientos", "doscientas", "quinientos", "quinientas", "cien", "ciento"
- Millares: "mil", "mil quinientos", "dos mil"
- Millones: "un millón", "millón"
- Decimales con coma: "dos coma cinco" -> "2,5", "cero coma setenta y cinco" -> "0,75"
- Fracciones: "medio" -> "0,5", "un cuarto" -> "0,25", "tres cuartos" -> "0,75"
- Mezclas: "25 y medio" -> "25,5", "veinticinco y medio" -> "25,5", "dos y medio" -> "2,5"
- Cifras ya en dígitos: "25" se conserva
- "un/una" como artículo: "un tornillo" (caso especial)
- Expresiones no reconocidas se dejan
- Formato sin separador miles, coma decimal

**parse.test.ts:**
- "tubería de dos pulgadas" -> no convierte "dos" (RF-465)
- "cinta dos rollos 5" -> solo convierte 5 (RF-467)
- "un tornillo" -> cantidad 1, nombre "tornillo" (RF-451)
- "cobre veinticinco metros" -> cantidad 25, unidad M (RF-470)
- "regleta diez cajas" -> cantidad 10, unidad CAJA (RF-438)

**units.test.ts:**
- Traducción correcta de tabla
- Palabras no traducibles: "ml", "metro lineal" no traducen

## Riesgos y mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Web Speech API varía entre navegadores (Safari parcial, Firefox sin soporte) | Alta | Alto | Seguir RNF-10 estrictamente: detectar soporte, mostrar nota RF-5 en Firefox, aceptar comportamiento parcial Safari. Tests manuales por navegador. |
| Permisos/micrófono bloqueado | Alta | Medio | Implementar todos los mensajes RF-56 a RF-63, no pedir permiso antes de aceptar aviso, no reintentar petición si bloqueado permanentemente. |
| Silencio 2s confuso en almacén ruidoso | Media | Medio | Implementar exactamente RF-20, mostrar "Dictado detenido" claro, permitir reintentar. |
| Doble escucha / solapamiento | Media | Alto | Control global de sesión activa, deshabilitar durante alta (RF-26), lógica RF-23, RF-25. |
| Conversión numérica ambigua | Media | Alto | Solo última expresión válida, dejar tal cual si no reconoce (RF-51), tests exhaustivos. |
| "un/una" mal interpretado | Media | Alto | Regla RF-50 estricta con excepciones "un millón", "un cuarto". Tests específicos. |
| localStorage bloqueado | Media | Bajo | try/catch en storage, volver a mostrar aviso si no se puede guardar (RF-14). |
| Plegar modo rápido durante dictado | Media | Medio | Cerrar sesión al plegar conservando texto (RF-8). |
| Cantidad > 0 cambio afecta validación existente | Alta | Alto | Verificar que RF-55 no rompe validaciones existentes. Solo cambia requisito mínimo. |
| Líneas que fallan ahora se conservan (RNF-8b) | Alta | Alto | Cambio de comportamiento aditivo pero importante. Verificar RF-54 en todos los flujos. |

## Orden de implementación

1. **Andamiaje de tests** (T1) - Añadir configuración node --test, crear estructura de tests para lógica pura
2. **Lógica pura compartida** (T2) - `packages/shared/src/voice/*` o `apps/web/lib/voice/*` con numerals, units, parse. Compilar si en shared.
3. **API: command.parser** (T3) - Añadir normalización (conversión numérica, traducción unidades) antes de interpretar. Aplicar RF-38, RF-40, RF-46-RF-52
4. **API: lists.service** (T4) - Cambiar validación cantidad > 0 (RF-55), conservar líneas que fallan (RF-54)
5. **Web: Web Speech wrapper** (T5) - `webspeech.ts` con manejo de estados, permisos, silencio
6. **Web: Componente VoiceDictation** (T6) - Reutilizable con aviso privacidad, estados, accesibilidad
7. **Web: Integrar en las 3 zonas** (T7) - AddItemForm, CommandBar, NuevoRegistroObraForm
8. **Web: Normalización en cliente para modo rápido** (T8) - Asegurar que conversión también se aplique visualmente/antes de enviar
9. **Tests completos y validación** (T9) - Ejecutar tests node --test, compilar paquetes, verificar casos límite
10. **Ajustes y pulido** (T10) - Mensajes de error, accesibilidad, responsive 320px

**Nota:** Primera tarea debe ser andamiaje de tests según indicación.
