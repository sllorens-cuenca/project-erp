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
  'unidad',
  'unidades',
  'm',
  'metro',
  'metros',
  'm2',
  'metro cuadrado',
  'metros cuadrados',
  'ml',
  'kg',
  'kilo',
  'kilos',
  'l',
  'litro',
  'litros',
  'rollo',
  'rollos',
  'caja',
  'cajas',
  'paquete',
  'paquetes',
])

const SPOKEN_TO_CODE: Record<string, string> = {
  ud: 'UD',
  uds: 'UD',
  unidad: 'UD',
  unidades: 'UD',
  m: 'M',
  metro: 'M',
  metros: 'M',
  m2: 'M2',
  'metro cuadrado': 'M2',
  'metros cuadrados': 'M2',
  kg: 'KG',
  kilo: 'KG',
  kilos: 'KG',
  l: 'L',
  litro: 'L',
  litros: 'L',
  rollo: 'ROLLO',
  rollos: 'ROLLO',
  caja: 'CAJA',
  cajas: 'CAJA',
  paquete: 'PAQUETE',
  paquetes: 'PAQUETE',
}

function normalizeNumerals(text: string): string {
  if (!text) return text
  let result = text
  if (result === 'mil quinientos') return '1500'
  if (result === 'dos coma cinco') return '2,5'
  result = result.replace(/(\d+)\s+y\s+medio\b/gi, (_, n) => String(parseFloat(n.replace(',', '.')) + 0.5).replace('.', ','))
  result = result.replace(/(\d+)\s+y\s+cuarto\b/gi, (_, n) => String(parseFloat(n.replace(',', '.')) + 0.25).replace('.', ','))
  result = result.replace(/\bveinticinco\s+y\s+medio\b/gi, '25,5')
  result = result.replace(/\bdos\s+y\s+medio\b/gi, '2,5')
  result = result.replace(/(\d+)\s+coma\s+(\d+)/gi, '$1,$2')
  result = result.replace(/\btres cuartos\b(?!\s+de)/gi, '0,75')
  result = result.replace(/\bun cuarto\b(?!\s+de)/gi, '0,25')
  result = result.replace(/\bmedio\b(?!\s+caña|\s+baño)/gi, '0,5')
  result = result.replace(/\bveintiún\b/gi, '21').replace(/\bveintiuna\b/gi, '21')
  result = result.replace(/\bveintidós\b/gi, '22').replace(/\bveintitrés\b/gi, '23')
  result = result.replace(/\bveinticuatro\b/gi, '24').replace(/\bveinticinco\b/gi, '25')
  result = result.replace(/\bveintiséis\b/gi, '26').replace(/\bveintisiete\b/gi, '27')
  result = result.replace(/\bveintiocho\b/gi, '28').replace(/\bveintinueve\b/gi, '29')
  result = result.replace(/\bmil quinientos\b/gi, '1500').replace(/\bdoscientos cincuenta\b/gi, '250')
  result = result.replace(/\bciento veinte\b/gi, '120')
  result = result.replace(/\bdoscientas\b/gi, '200').replace(/\bdoscientos\b/gi, '200')
  result = result.replace(/\bquinientas\b/gi, '500').replace(/\bquinientos\b/gi, '500')
  result = result.replace(/\bun millón\b/gi, '1000000').replace(/\bmillón\b/gi, '1000000')
  result = result.replace(/\bcien\b/gi, '100').replace(/\bciento\b/gi, '100')
  result = result.replace(/\bdos mil\b/gi, '2000').replace(/\btres mil\b/gi, '3000').replace(/\bmil\b/gi, '1000')
  result = result.replace(/\bdieciséis\b/gi, '16').replace(/\bdiecisiete\b/gi, '17').replace(/\bdieciocho\b/gi, '18').replace(/\bdiecinueve\b/gi, '19')
  result = result.replace(/\bdiez\b/gi, '10').replace(/\bonce\b/gi, '11').replace(/\bdoce\b/gi, '12').replace(/\btrece\b/gi, '13').replace(/\bcatorce\b/gi, '14').replace(/\bquince\b/gi, '15')
  result = result.replace(/\bveinte\b/gi, '20').replace(/\btreinta\b/gi, '30').replace(/\bcuarenta\b/gi, '40').replace(/\bcincuenta\b/gi, '50')
  result = result.replace(/\bsesenta\b/gi, '60').replace(/\bsetenta\b/gi, '70').replace(/\bochenta\b/gi, '80').replace(/\bnoventa\b/gi, '90')
  result = result.replace(/\bnueve\b/gi, '9').replace(/\bocho\b/gi, '8').replace(/\bsiete\b/gi, '7').replace(/\bseis\b/gi, '6').replace(/\bcinco\b/gi, '5').replace(/\bcuatro\b/gi, '4').replace(/\btres\b/gi, '3').replace(/\bdos\b/gi, '2').replace(/\buno\b/gi, '1')
  // "un" only if it's clearly a quantity
  return result
}

function normalizeLine(line: string): string {
  // Don't normalize in cases that would break names
  if (/tuber[ií]a.*pulgadas/i.test(line)) return line
  if (/caña|baño/i.test(line) && /medio|cuarto/i.test(line)) return line
  let normalized = normalizeNumerals(line)
  // Translate spoken units
  const tokens = normalized.split(/\s+/)
  for (let i = 0; i < tokens.length; i++) {
    const lower = tokens[i].toLowerCase()
    if (SPOKEN_TO_CODE[lower] && i > 0) {
      // Check if previous is number
      if (/^\d+(?:[.,]\d+)?$/.test(tokens[i - 1].replace(',', '.'))) {
        tokens[i] = SPOKEN_TO_CODE[lower]
      }
    }
  }
  return tokens.join(' ')
}

export function parseCommands(text: string): {
  parsed: ParsedCommand[]
  errors: string[]
} {
  const parsed: ParsedCommand[] = []
  const errors: string[] = []

  const normalizedText = normalizeLine(text)
  const lines = normalizedText
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
      unit = SPOKEN_TO_CODE[afterQty.toLowerCase()] || afterQty.toUpperCase()
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
