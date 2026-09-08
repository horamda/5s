const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { join } = require('node:path');

const html = readFileSync(join(__dirname, '..', 'Dashboard_DPO_5S_Completo.html'), 'utf8');
const context = vm.createContext({});
vm.runInContext(html.slice(html.indexOf('function avg('), html.indexOf('function ownerByBranch(')), context);

const raw = {
  Fecha: '30/6/2026', Ubicacion: 'Dolores', Area: 'Flota', Sector: 'Camion 16',
  '18. Se corrigen los desvíos detectados en auditorías anteriores.': '5 = Cumple totalmente',
  '20. Las auditorías generan acciones concretas y mejoras reales.': '4 = Cumple',
  'Observaciones / Desvíos detectados': '',
  'Acción sugerida / Responsable (opcional)': ''
};

test('Los hallazgos vacíos no se completan con respuestas del cuestionario', () => {
  const result = context.norm(raw);
  assert.equal(result.observaciones, '');
  assert.equal(result.accion, '');
});

test('El reporte conserva las observaciones y acciones reales', () => {
  const result = context.norm({ ...raw,
    'Observaciones / Desvíos detectados': 'Faltan etiquetas',
    'Acción sugerida / Responsable (opcional)': 'Reponer etiquetas / Juan'
  });
  assert.equal(result.observaciones, 'Faltan etiquetas');
  assert.equal(result.accion, 'Reponer etiquetas / Juan');
});
