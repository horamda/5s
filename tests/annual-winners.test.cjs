const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const html = readFileSync(require('node:path').join(__dirname, '..', 'Dashboard_DPO_5S_Completo.html'), 'utf8');
const context = vm.createContext({ MONTHS: Array.from({length:12}, (_,i)=>String(i+1)), ownerByBranch: (b,a)=>`${b}/${a}` });
vm.runInContext(html.slice(html.indexOf('function avg('), html.indexOf('function dp(')), context);
vm.runInContext(html.slice(html.indexOf('function annualWinnerMonths('), html.indexOf('function buildMatrix(')), context);
const row = (ubicacion, area, puntaje, mes=1, anio=2026, sector='Compartido') => ({ubicacion, area, puntaje, mes, anio, sector});
test('Separa sucursales y años, promedia auditorías y conserva empates', () => {
 const rows=[row('Casa Central','A',100),row('Casa Central','A',60),row('Casa Central','B',80),row('Dolores','C',99),row('Casa Central','D',100,1,2025)];
 const months=context.annualWinnerMonths(rows,2026,'Casa Central','areas');
 assert.equal(months.length,12);
 assert.equal(months[0].winners.length,2);
 assert.equal(months[0].winners[0].score,80);
 assert.equal(months[0].winners[0].scores.length,2);
 assert.equal(months[1].winners.length,0);
 assert.equal(context.annualWinnerMonths(rows,2026,'Dolores','areas')[0].winners[0].name,'C');
});
test('No mezcla sectores homónimos y respeta el corte de reportes', () => {
 const rows=[row('Dolores','A',70),row('Dolores','B',90),row('Dolores','A',100,6)];
 const months=context.annualWinnerMonths(rows,2026,'Dolores','sectores',2);
 assert.equal(months[0].winners[0].area,'B');
 assert.equal(months[0].winners[0].score,90);
 assert.equal(months[5].winners.length,0);
 assert.equal(months[5].outsideCutoff,true);
});
test('Presenta empates, responsables, meses vacíos y escapa nombres', () => {
 const output=context.annualWinnersHtml([row('Dolores','<A>',80),row('Dolores','B',80)],2026,['Dolores']);
 assert.match(output,/Empate/);
 assert.match(output,/Dolores\/&lt;A&gt;/);
 assert.match(output,/Sin datos/);
 assert.match(output,/80\.00%/);
 assert.doesNotMatch(output,/<A>/);
});
