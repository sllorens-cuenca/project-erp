/**
 * Intérprete de la barra de comandos del almacén.
 *
 * Sintaxis soportada (una por línea, o separadas por ";"):
 *   /cobre 25 m       → material "cobre", 25, unidad "m"
 *   +regleta 10       → material "regleta", 10
 *   tuberia 12/14 5   → material "tuberia 12/14", 5
 *
 * Regla: se toma como cantidad **el último número de la línea**; el resto es
 * el nombre del material. Un prefijo "/" o "+" es opcional.
 */

export interface ParsedCommand {
  raw: string
  materialName: string
  quantity: number
  unit?: string
}

const UNIT_HINTS = new Set([
  'ud',
  'uds',
  'm',
  'm2',
  'ml',
  'kg',
  'l',
  'rollo',
  'rollos',
  'caja',
  'cajas',
  'paquete',
  'paquetes',
])

export function parseCommands(text: string): {
  parsed: ParsedCommand[]
  errors: string[]
} {
  const parsed: ParsedCommand[] = []
  const errors: string[] = []

  const lines = text
    .split(/[\n;]+/)
    .map((l) => l.trim())
    .filter(Boolean)

  for (const raw of lines) {
    const cleaned = raw.replace(/^[/+]+\s*/, '').trim()
    if (!cleaned) continue

    const tokens = cleaned.split(/\s+/)
    // Localiza el último token numérico como cantidad.
    let qtyIndex = -1
    for (let i = tokens.length - 1; i >= 0; i--) {
      if (/^\d+(?:[.,]\d+)?$/.test(tokens[i])) {
        qtyIndex = i
        break
      }
    }

    if (qtyIndex <= 0) {
      errors.push(`No se entiende "${raw}" (falta cantidad o material).`)
      continue
    }

    const quantity = Number(tokens[qtyIndex].replace(',', '.'))
    const nameTokens = tokens.slice(0, qtyIndex)

    // Unidad opcional: token siguiente a la cantidad si parece una unidad.
    let unit: string | undefined
    const afterQty = tokens[qtyIndex + 1]
    if (afterQty && UNIT_HINTS.has(afterQty.toLowerCase())) {
      unit = afterQty
    }

    const materialName = nameTokens.join(' ').trim()
    if (!materialName) {
      errors.push(`No se entiende "${raw}" (falta el material).`)
      continue
    }

    parsed.push({ raw, materialName, quantity, unit })
  }

  return { parsed, errors }
}
