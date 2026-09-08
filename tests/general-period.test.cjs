const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const html = readFileSync(join(__dirname, '..', 'Dashboard_DPO_5S_Completo.html'), 'utf8');
const general = readFileSync(join(__dirname, '..', 'general-report.js'), 'utf8');
const row = (ubicacion, anio, mes, puntaje) => ({ ubicacion, anio, mes, puntaje,
  area: 'Flota', sector: 'Camion 1', cincoS: { Organizar: puntaje } });
const context = vm.createContext({ DATA: [row('Casa Central', 2026, 2, 80),
  row('Casa Central', 2026, 6, 100), row('Dolores', 2026, 1, 60),
  row('Dolores', 2026, 6, 90), row('Dolores', 2025, 2, 20)] });
vm.runInContext(html.slice(html.indexOf('function avg('), html.indexOf('function init(')), context);
vm.runInContext(general.slice(general.indexOf('function branchSummary('), general.indexOf('function renderBranchCards(')), context);

test('General compara exactamente el mes elegido y excluye meses posteriores y otros años', () => {
  const central = context.branchSummary('Casa Central', 2026, 2);
  const dolores = context.branchSummary('Dolores', 2026, 2);
  assert.equal(central.month, 80);
  assert.equal(central.ytd, 80);
  assert.equal(central.audits, 1);
  assert.equal(dolores.monthNum, 2);
  assert.equal(dolores.mr.length, 0);
  assert.equal(dolores.ytd, 60);
  assert.equal(dolores.audits, 1);
});

test('Un mes sin auditorías mantiene el YTD sin sustituir el resultado mensual', () => {
  const result = context.branchSummary('Dolores', 2026, 12);
  assert.equal(result.mr.length, 0);
  assert.equal(result.monthAudits, 0);
  assert.equal(result.ytd, 75);
  assert.equal(result.audits, 2);
});
