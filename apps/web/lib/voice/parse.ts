import { convertNumeralsES } from './numerals';
import { translateSpokenUnit } from './units';

export interface ParsedMaterial {
  materialName: string;
  quantity: number;
  unit?: string;
  raw: string;
}

function isNumberToken(token: string): boolean {
  return /^\d+(?:[.,]\d+)?$/.test(token.replace(',', '.'));
}

const UNIT_WORDS = ['m', 'metro', 'metros', 'm2', 'kg', 'kilo', 'kilos', 'l', 'litro', 'litros', 'rollo', 'rollos', 'caja', 'cajas', 'paquete', 'paquetes', 'ud', 'uds', 'unidad', 'unidades', 'ml'];

export function parseForForm(text: string): ParsedMaterial | null {
  if (!text?.trim()) return null;
  let normalized = convertNumeralsES(text);
  
  const tokens = normalized.trim().split(/\s+/);
  // Find last number token
  let qtyIndex = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i].replace(',', '.');
    if (/^\d+(?:\.\d+)?$/.test(t)) {
      qtyIndex = i;
      break;
    }
  }
  
  if (qtyIndex < 0) return null;
  if (qtyIndex === 0) return null; // need material name
  
  const qtyStr = tokens[qtyIndex].replace(',', '.');
  const quantity = Number(qtyStr);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  
  let unit: string | undefined;
  const afterQty = tokens[qtyIndex + 1];
  if (afterQty) {
    const translated = translateSpokenUnit(afterQty);
    if (translated) {
      unit = translated;
    }
  }
  
  const nameTokens = tokens.slice(0, qtyIndex);
  const materialName = nameTokens.join(' ').trim();
  if (!materialName) return null;
  
  return { materialName, quantity, unit, raw: text };
}

export function parseMaterialLine(line: string): ParsedMaterial | null {
  return parseForForm(line);
}
