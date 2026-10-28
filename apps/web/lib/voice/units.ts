export const SPOKEN_UNITS: Record<string, string> = {
  'ud': 'UD',
  'uds': 'UD',
  'unidad': 'UD',
  'unidades': 'UD',
  'm': 'M',
  'metro': 'M',
  'metros': 'M',
  'm2': 'M2',
  'metro cuadrado': 'M2',
  'metros cuadrados': 'M2',
  'kg': 'KG',
  'kilo': 'KG',
  'kilos': 'KG',
  'l': 'L',
  'litro': 'L',
  'litros': 'L',
  'rollo': 'ROLLO',
  'rollos': 'ROLLO',
  'caja': 'CAJA',
  'cajas': 'CAJA',
  'paquete': 'PAQUETE',
  'paquetes': 'PAQUETE',
};

export const NON_TRANSLATABLE_UNITS = ['ml', 'metro lineal', 'metros lineales'];

export function translateSpokenUnit(word: string): string | undefined {
  if (!word) return undefined;
  const lower = word.toLowerCase();
  if (NON_TRANSLATABLE_UNITS.includes(lower)) return undefined;
  return SPOKEN_UNITS[lower];
}
