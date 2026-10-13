/**
 * Utilidades de texto para búsquedas tolerantes a acentos y mayúsculas.
 *
 * SQLite (y algunos motores) no normalizan los acentos en `contains`, por lo
 * que "tuberia" no encontraría "Tubería". Normalizamos en memoria antes de
 * comparar; es suficiente para catálogos pequeños/medianos.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/** ¿El texto `haystack` contiene el término `needle` (ignorando acentos)? */
export function matches(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) return false
  return normalizeText(haystack).includes(normalizeText(needle))
}
