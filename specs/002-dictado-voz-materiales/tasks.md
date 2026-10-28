# Tareas 002 — Dictado por voz para añadir materiales

Spec aprobada: `specs/002-dictado-voz-materiales/spec.md` · Plan: `specs/002-dictado-voz-materiales/plan.md`

Orden: Tests → Lógica pura → API → Web Speech → Componente → Integración → Validación. Máximo 12 tareas. Node 22 vía nvm: `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"`.

- [x] **T1. Andamiaje de tests con `node --test`** RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52, RNF-12
  - Añadir configuración para ejecutar tests con `node --test` en el proyecto (script en `package.json` raíz, soporte TypeScript con `tsx` o equivalente coherente con monorepo).
  - Crear estructura `apps/web/lib/voice/*.test.ts` (o `packages/shared/src/voice/*.test.ts` si se comparte).
  - Añadir tests iniciales mínimos para verificar que el runner funciona.
  - Hecho cuando: `npm test` (o comando acordado) ejecuta los tests sin errores; se puede añadir/ejecutar tests TypeScript con `node --test`.

- [x] **T2. Lógica pura: conversión de numerales ES** RF-41, RF-42, RF-43, RF-44, RF-45, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52
  - Crear `apps/web/lib/voice/numerals.ts` con `convertNumeralsES` y helpers. Soportar: unidades, veintiuno-veintinueve y variantes apocopadas (veintiún/veintiuna), centenas masculino/femenino, millares con/sin número delante, millones, cien/ciento, decimales con coma, fracciones (medio/un cuarto/tres cuartos/y medio/y cuarto) solo en posición de cantidad, mezclas cifra+fracción, cifras ya en dígitos, formato sin separador miles con coma decimal, "un/una" como artículo vs cantidad, expresiones no reconocidas se dejan.
  - Añadir `numerals.test.ts` con tabla completa exigida por RNF-370.
  - Hecho cuando: todos los tests de numerales pasan; casos clave (1500, 2,5, 0,75, 25,5, 1000000) correctos; "tubería de dos pulgadas" no convierte "dos"; cifras dudosas se dejan sin inventar.

- [x] **T3. Lógica pura: unidades habladas y reparto nombre/cantidad/unidad** RF-37, RF-38, RF-47, RF-48, RF-50
  - Crear `apps/web/lib/voice/units.ts` con tabla cerrada SPOKEN_UNITS, NON_TRANSLATABLE_UNITS (ml, metro lineal, metros lineales). `translateSpokenUnit`.
  - Crear `apps/web/lib/voice/parse.ts` con `parseMaterialLine` y `parseForForm`. Reparto por última expresión numérica, unidad detrás de cantidad, regla "un/una".
  - Añadir `parse.test.ts` y `units.test.ts` con casos: "cinta dos rollos 5", "un tornillo", "cobre veinticinco metros", "regleta diez cajas", unidad no traducible.
  - Hecho cuando: tests pasan; reparto correcto según reglas; traducción respeta tabla y no traduce palabras fuera de ella.

- [x] **T4. API: normalización en `command.parser.ts`** RF-38, RF-40, RF-41, RF-42, RF-43, RF-44, RF-45, RF-46, RF-47, RF-48, RF-49, RF-50, RF-51, RF-52
  - Importar/usar lógica pura para normalizar texto antes de interpretar. Aplicar conversión de numerales a todo el texto del modo rápido (venga de micrófono o teclado). Traducir unidades habladas a código cuando van detrás de cantidad (RF-38). Mantener reglas existentes (última cifra, prefijos / +, líneas separadas por \n o ;).
  - Hecho cuando: al interpretar líneas con numerales en palabras se convierten correctamente; "regleta diez cajas" se interpreta con unidad CAJA; "tubería de dos pulgadas" no se altera incorrectamente; compila `npm run build -w @erp/api`.

- [x] **T5. API: validación y conservación de líneas que fallan en `lists.service.ts`** RF-54, RF-55, RNF-8
  - Cambiar validación de cantidad a > 0 (admite 0,5, 0,25). Mostrar mensaje de validación solo con 0, negativo o no numérico. Mantener aviso de stock si cantidad pedida > stock disponible.
  - Al añadir varias líneas y alguna falle, añadir las válidas, dejar **solo** las que fallaron en el área de texto, mostrar errores uno por línea identificando su línea (RF-54).
  - Hecho cuando: se pueden añadir cantidades decimales > 0; cantidad 0/negativa/no numérica rechaza con mensaje existente; con mezcla de válidas/fallidas solo quedan las fallidas en el área con sus errores; compila `npm run build -w @erp/api`.

- [x] **T6. Web: wrapper Web Speech API y storage de privacidad** RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-19, RF-20, RF-21, RF-23, RF-24, RF-25, RNF-1
  - Crear `apps/web/lib/voice/storage.ts` para recordar aceptación de aviso (localStorage con try/catch).
  - Crear `apps/web/lib/voice/webspeech.ts` wrapper sobre SpeechRecognition: pedir idioma es-ES, solicitar permiso solo tras aceptar aviso, detectar silencio 2s, tratar cierre del navegador como parada por silencio, cerrar al salir de pantalla, evitar dos escuchas simultáneas, manejar errores RF-56-RF-63.
  - Hecho cuando: lógica de estados correcta; no pide permiso antes de aviso; silencio cierra a los 2s; cierre navegador tratado como silencio; compila `npm run build -w @erp/web`.

- [x] **T7. Web: componente reutilizable `VoiceDictation`** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-17, RF-18, RNF-3, RNF-6, RNF-7
  - Crear `apps/web/components/VoiceDictation.tsx` con: botón "Dictar"/"Detener" con icono micrófono, enlace "Qué pasa con mi voz", estado "Escuchando…", diálogo de privacidad (foco, Escape = "Ahora no", "Aceptar y dictar"/"Ahora no"), mensajes de error en español, accesibilidad (aria-labels, 44x44px, teclado).
  - Mostrar nota si navegador sin soporte (RF-5). Respetar permisos por rol/estado registro (RF-2, RF-3).
  - Hecho cuando: componente reutilizable, textos exactos RNF-7, accesible, responsive 320px, compila `npm run build -w @erp/web`.

- [x] **T8. Integrar dictado en las 3 zonas** RF-1, RF-7, RF-8, RF-22, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38, RF-39, RF-40
  - **Detalle registro - AddItemForm**: añadir VoiceDictation, repartir transcripción con parseMaterialLine, autoselección por coincidencia exacta (RF-34), prevalencia unidad dictada (RF-37), mostrar "Se ha entendido: ..." (RF-33), re-dictar sustituye nombre/cantidad (RF-36).
  - **Detalle registro - CommandBar (modo rápido)**: añadir dentro de zona desplegable, si plegada no hay dictado, al plegar cerrar sesión conservando texto (RF-8), acumular tramos separados por salto de línea (RF-29), traducir unidades habladas a código (RF-38), aplicar conversión también a texto tecleado (RF-40, RF-46).
  - **Ficha obra - NuevoRegistroObraForm**: añadir VoiceDictation, rellenar formulario sin crear registro, sin cambiar obra ni tocar notas (RF-7), mismas reglas de reparto/autoselección/unidad.
  - Deshabilitar durante alta en curso (RF-26), cerrar sesión al pulsar añadir (RF-27).
  - Hecho cuando: dictado funciona en las 3 zonas, cumple todos los RF de integración, textos y comportamientos correctos, compila `npm run build -w @erp/web`.

- [x] **T9. Tests completos, validación lógica y compilación** RF-41-RF-52, RF-54, RF-55, RNF-8, RNF-12
  - Ejecutar todos los tests `node --test` y que pasen (numerals, parse, units).
  - Verificar casos límite críticos: "un millón"/"un cuarto" vs "un tornillo", "cien"/"ciento", fracciones fuera de cantidad, solo última expresión numérica, unidades no traducibles.
  - Compilar `@erp/shared` si se modificó, luego `npm run build -w @erp/api` y `npm run build -w @erp/web`.
  - Verificar cambio RF-55 no rompe flujo existente (cantidades > 0 válidas).
  - Hecho cuando: `npm test` pasa sin fallos, ambos paquetes compilan con Node 22, lógica pura cubierta según RNF-12.

- [x] **T10. Recorrido manual guiado y verificación de criterios** RF-1-RF-63, RNF-1-RNF-11
  - Recorrer checklist de criterios de finalización (secciones: dónde está, aviso privacidad, inicio/escucha/fin, revisión/confirmación, conversión, varios materiales, validación, permisos/errores).
  - Verificar RNF-10 matriz navegadores: Chrome/Edge desktop, Chrome Android (completo); Safari macOS/iOS (parcial - texto al cerrar tramo); Firefox (sin soporte → nota RF-5).
  - Verificar RNF-6 en 320px (uso con una mano), RNF-3 accesibilidad, RNF-11 teclado mientras dicta.
  - Verificar RNF-8: tres cambios acotados funcionan también sin dictado.
  - Actualizar `MEMORY.md` con resumen de feature 002 (archivos clave, decisiones importantes).
  - Hecho cuando: todos los criterios aplicables verificados, compilan ambos paquetes, `MEMORY.md` actualizado.

## Resumen final (a completar al terminar)
- **Nº tareas:** 10
- **Archivos nuevos:** `apps/web/lib/voice/*`, `apps/web/components/VoiceDictation.tsx`, `apps/web/lib/voice/*.test.ts` (+ posibles en shared)
- **Dónde/tests/cómo:** Tests con `node --test` en lógica pura (numerals/parse/units). Ejecutar con Node 22 vía nvm. Compilación con `npm run build` en api/web. Verificación manual por matriz navegadores.
- **Riesgos principales:** Variabilidad Web Speech API entre navegadores (Safari parcial/Firefox sin soporte), manejo correcto de permisos/silencio 2s, evitar dobles escuchas, conversión numérica ambigua (mitigado con tests exhaustivos y regla "solo última expresión válida").
