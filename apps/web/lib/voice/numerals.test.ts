import { test } from 'node:test';
import assert from 'node:assert';
import { convertNumeralsES } from './numerals.ts';

test('unidades y decenas basicas', () => {
  assert.equal(convertNumeralsES('uno'), '1');
  assert.equal(convertNumeralsES('cinco'), '5');
  assert.equal(convertNumeralsES('diez'), '10');
  assert.equal(convertNumeralsES('quince'), '15');
});

test('veintiuno a veintinueve y variantes', () => {
  assert.equal(convertNumeralsES('veintiuno'), '21');
  assert.equal(convertNumeralsES('veintiún'), '21');
  assert.equal(convertNumeralsES('veintiuna'), '21');
  assert.equal(convertNumeralsES('veintinueve'), '29');
});

test('centenas masculino y femenino', () => {
  assert.equal(convertNumeralsES('doscientos'), '200');
  assert.equal(convertNumeralsES('doscientas'), '200');
  assert.equal(convertNumeralsES('quinientos'), '500');
  assert.equal(convertNumeralsES('quinientas'), '500');
  assert.equal(convertNumeralsES('doscientos cincuenta'), '250');
});

test('millares', () => {
  assert.equal(convertNumeralsES('mil'), '1000');
  assert.equal(convertNumeralsES('mil quinientos'), '1500');
  assert.equal(convertNumeralsES('dos mil'), '2000');
});

test('millones', () => {
  assert.equal(convertNumeralsES('un millón'), '1000000');
  assert.equal(convertNumeralsES('millón'), '1000000');
});

test('cien y ciento', () => {
  assert.equal(convertNumeralsES('cien'), '100');
  assert.equal(convertNumeralsES('ciento'), '100');
});

test('decimales con coma', () => {
  assert.equal(convertNumeralsES('dos coma cinco'), '2,5');
  assert.equal(convertNumeralsES('cero coma setenta y cinco'), '0,75');
});

test('fracciones', () => {
  assert.equal(convertNumeralsES('medio'), '0,5');
  assert.equal(convertNumeralsES('un cuarto'), '0,25');
  assert.equal(convertNumeralsES('tres cuartos'), '0,75');
});

test('mezclas cifra y fraccion', () => {
  assert.equal(convertNumeralsES('25 y medio'), '25,5');
  assert.equal(convertNumeralsES('veinticinco y medio'), '25,5');
  assert.equal(convertNumeralsES('dos y medio'), '2,5');
});

test('cifras ya en digitos se conservan', () => {
  assert.equal(convertNumeralsES('25'), '25');
});

test('solo ultima expresion numerica', () => {
  assert.equal(convertNumeralsES('tubería de dos pulgadas'), 'tubería de dos pulgadas');
  assert.equal(convertNumeralsES('tuberia de dos pulgadas'), 'tuberia de dos pulgadas');
  assert.equal(convertNumeralsES('cinta dos rollos 5'), 'cinta dos rollos 5');
});

test('formato sin separador miles con coma decimal', () => {
  assert.equal(convertNumeralsES('mil quinientos'), '1500');
  assert.equal(convertNumeralsES('dos coma cinco'), '2,5');
});
