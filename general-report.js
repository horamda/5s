function generalPeriod() {
  const yearSelect = document.getElementById('generalYear');
  const monthSelect = document.getElementById('generalMonth');
  const years = [...new Set(DATA.map(row => row.anio).filter(Boolean))].sort((a, b) => b - a);
  const savedYear = yearSelect.value;
  yearSelect.innerHTML = years.map(year => `<option value="${year}">${year}</option>`).join('');
  yearSelect.value = years.includes(+savedYear) ? savedYear : (years[0] || '');
  if (!monthSelect.options.length) {
    monthSelect.innerHTML = '<option value="">Último mes disponible</option>' +
      MONTHS.map((month, index) => `<option value="${index + 1}">${month}</option>`).join('');
  }
  const year = +yearSelect.value;
  return { year, month: +monthSelect.value || latestMonth(DATA, year) };
}

function branchSummary(b, y, m = latestMonth(DATA, y)) {
  const rows = DATA.filter(row => row.ubicacion === b && row.anio === y && row.mes <= m);
  const mr = rows.filter(row => row.mes === m), yr = rows;
  const areas = group(yr, row => row.area);
  const weakS = ['Organizar', 'Ordenar', 'Limpiar', 'Estandarizar', 'Disciplina']
    .map(s => [s, avg(yr.map(row => row.cincoS[s]))]).sort((a, b) => a[1] - b[1]);
  return { branch: b, rows, mr, yr, monthNum: m,
    month: avg(mr.map(row => row.puntaje)), ytd: avg(yr.map(row => row.puntaje)),
    audits: rows.length, monthAudits: mr.length,
    areas: uniq(rows, 'area').length, sectors: uniq(rows, 'sector').length,
    best: areas[0] || ['-', 0], worst: areas[areas.length - 1] || ['-', 0], weakS: weakS[0] };
}

function renderBranchCards(items) {
  branchCompare.innerHTML = items.map(s => `<div class="branch-card"><h3>${s.branch}</h3>
    <div class="branch-metrics">
    <div class="mini-metric"><small>Mes (${MONTHS[s.monthNum - 1]})</small><b>${s.mr.length ? s.month.toFixed(1) + '%' : '-'}</b></div>
    <div class="mini-metric"><small>YTD</small><b>${s.yr.length ? s.ytd.toFixed(1) + '%' : '-'}</b></div>
    <div class="mini-metric"><small>Auditorías YTD</small><b>${s.audits}</b></div>
    <div class="mini-metric"><small>Áreas / sectores YTD</small><b>${s.areas}/${s.sectors}</b></div></div>
    <div class="note" style="margin:12px 0 0;display:block">${s.yr.length ?
      `<b>Mejor área YTD:</b> ${s.best[0]} (${s.best[1].toFixed(0)}%) · <b>Área a reforzar YTD:</b> ${s.worst[0]} (${s.worst[1].toFixed(0)}%)` :
      'Sin auditorías hasta el mes seleccionado.'}${s.yr.length && !s.mr.length ? '<br>Sin auditorías en el mes seleccionado.' : ''}</div></div>`).join('');
}

function renderGeneralBars(items) {
  generalBars.className = 'general-bars';
  generalBars.innerHTML = items.map(s => {
    const delta = s.month - s.ytd;
    return `<div class="general-bar-card"><div class="general-bar-head"><b>${s.branch}</b><span>${s.mr.length ? `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts mes vs YTD` : 'Sin auditorías en el mes seleccionado'}</span></div>` +
      [['Mes', s.month, s.mr.length], ['YTD', s.ytd, s.yr.length]].map(([label, score, count]) =>
        `<div class="bar"><div class="bar-name">${label}</div><div class="track">${count ? `<div class="fill" style="width:${Math.max(score, 4)}%;background:${col(score)}">${score.toFixed(0)}%</div>` : ''}</div><b>${count ? score.toFixed(0) + '%' : '-'}</b></div>`).join('') + '</div>';
  }).join('') + '<div class="general-note">Objetivo operativo: 80% · Verde desde 85%</div>';
}

function showGeneral() {
  dashboardView.style.display = 'none'; subTabs.style.display = 'none';
  methodologyView.classList.remove('active'); generalView.classList.add('active');
  status.style.visibility = 'visible'; yearLabel.style.visibility = 'visible';
  const { year: y, month: m } = generalPeriod();
  const items = ['Casa Central', 'Dolores'].map(b => branchSummary(b, y, m));
  const allY = DATA.filter(row => row.anio === y && row.mes <= m), allM = allY.filter(row => row.mes === m);
  const ranked = items.filter(s => s.yr.length).sort((a, b) => b.ytd - a.ytd);
  const leader = ranked[0], comparable = ranked.length === 2;
  const tied = comparable && Math.abs(ranked[0].ytd - ranked[1].ytd) < 0.000001;
  const gap = comparable ? Math.abs(ranked[0].ytd - ranked[1].ytd).toFixed(1) + ' pts' : 'Sin comparativo';
  mainTitle.textContent = 'RESULTADO GENERAL 5S - CASA CENTRAL VS DOLORES';
  yearLabel.textContent = y || ''; generalInfo.textContent = `Comparativo general · ${MONTHS[m - 1]} ${y || ''}`;
  generalCounts.innerHTML = dataCounts.innerHTML;
  gMonth.textContent = allM.length ? avg(allM.map(row => row.puntaje)).toFixed(1) + '%' : '-';
  gYtd.textContent = allY.length ? avg(allY.map(row => row.puntaje)).toFixed(1) + '%' : '-';
  gAudits.textContent = allM.length; gLeader.textContent = tied ? 'Empate' : leader ? leader.branch : '-';
  gGap.textContent = gap;
  renderBranchCards(items); renderGeneralBars(items);
  drawGeneralRadar(items.filter(s => s.yr.length)); drawGeneralTrend(y, m);
  const weak = ['Organizar', 'Ordenar', 'Limpiar', 'Estandarizar', 'Disciplina']
    .map(s => [s, avg(allY.map(row => row.cincoS[s]))]).sort((a, b) => a[1] - b[1]);
  generalWeakS.innerHTML = allY.length ? bars(weak) : '<small>Sin datos</small>';
  const areaRanking = group(allY, row => `${row.ubicacion} / ${row.area}`);
  generalRank.innerHTML = '<thead><tr><th>Ranking</th><th>Sucursal / Área</th><th>Resultado YTD</th></tr></thead><tbody>' +
    areaRanking.map(([label, score], index) => `<tr><td>${index + 1}</td><td>${reportEscape(label)}</td><td>${dot(score)}</td></tr>`).join('') + '</tbody>';
  generalOwnerRank.innerHTML = ownerRankTable(allY);
  const worst = areaRanking[areaRanking.length - 1];
  generalInsights.innerHTML = [
    ['Sucursal líder YTD', tied ? 'Empate' : leader ? `${leader.branch} ${leader.ytd.toFixed(1)}%` : 'Sin datos'],
    ['Brecha YTD', gap],
    ['Área más débil YTD', worst ? `${worst[0]} ${worst[1].toFixed(0)}%` : 'Sin datos'],
    ['5S a reforzar', allY.length ? `${weak[0][0]} ${weak[0][1].toFixed(0)}%` : 'Sin datos']
  ].map(([label, value]) => `<div class="insight"><small>${label}</small><b>${reportEscape(value)}</b></div>`).join('');
}

function generalMonthlyReportHtml() {
  const { year, month } = generalPeriod(), period = `${MONTHS[month - 1]} ${year}`;
  const savedStyle = generalView.getAttribute('style');
  const saved = { branch, view, month: fm.value, matrix: matrix.innerHTML, title: matrixTitle.textContent };
  let summary, charts, rankings, matrices = '';
  try {
    generalView.style.width = '1280px'; generalView.style.maxWidth = 'none';
    showGeneral();
    summary = reportClone(generalView.querySelector('.kpis')) + reportClone(branchCompare) + reportClone(generalInsights);
    charts = reportClone(generalBars.closest('.grid2')) + reportClone(generalTrend.closest('.card'));
    rankings = reportClone(generalRank.closest('.grid2')) + reportClone(generalWeakS.closest('.card'));
    fm.value = `${month}|${MONTHS[month - 1]}`;
    ['Casa Central', 'Dolores'].forEach((name, index) => {
      branch = name;
      const rows = DATA.filter(row => row.ubicacion === name && row.anio === year && row.mes <= month);
      let tables = '';
      ['areas', 'sectores'].forEach(mode => {
        view = mode; buildMatrix(rows, year);
        matrixTitle.textContent = mode === 'areas' ? 'Matriz mensual por área y dueño' : 'Matriz mensual por sector agrupada por área';
        tables += reportClone(matrix.closest('.card'));
      });
      matrices += `<section class="report-section" id="general-matrix-${index}"><div class="report-section-head"><span class="report-number">0${index + 4}</span><div><h2>${name}</h2><p>Matrices por área y sector · YTD hasta ${reportEscape(period)}.</p></div></div>${tables}</section>`;
    });
  } finally {
    branch = saved.branch; view = saved.view; fm.value = saved.month;
    matrix.innerHTML = saved.matrix; matrixTitle.textContent = saved.title;
    if (savedStyle === null) generalView.removeAttribute('style'); else generalView.setAttribute('style', savedStyle);
    showGeneral();
  }
  const heading = (number, title, subtitle) => `<div class="report-section-head"><span class="report-number">${number}</span><div><h2>${title}</h2><p>${subtitle}</p></div></div>`;
  const hasMonth = DATA.some(row => row.anio === year && row.mes === month);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="about:srcdoc"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Reporte general 5S · ${reportEscape(period)}</title><style>${monthlyReportStyles()}
    .canvas.tall{height:auto}.compare-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.branch-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}
    .branch-card{min-width:0;box-shadow:none}.insights{grid-template-columns:repeat(4,minmax(0,1fr))}.insight b{font-size:14px}
    @media screen and (max-width:700px){.compare-cards,.insights{grid-template-columns:1fr}}
    @media print{.compare-cards,.insights{break-inside:avoid}.branch-card{padding:10px}.mini-metric{padding:6px}.mini-metric b{font-size:17px}.branch-card .note{font-size:10px;padding:7px}.insight{padding:8px}.insight b{font-size:12px}}
    @media print{#general-charts .report-chart{max-height:210px}.general-bar-card{padding:8px}.general-bar-card .bar{margin:6px 0}.general-bars{gap:8px}
      [id^="general-matrix-"] .card{padding:8px;margin-bottom:10px}[id^="general-matrix-"] .card h3{margin-bottom:9px}
      [id^="general-matrix-"] td,[id^="general-matrix-"] th{padding:3px;font-size:9px}[id^="general-matrix-"] .legend{margin:4px 0 6px}}
    </style></head><body>
    <div class="report-head"><div class="report-brand"><div><p class="report-eyebrow">Del Palacio · Informe mensual 5S</p><h1>Resultado general</h1><p class="report-period">${reportEscape(period)}</p></div><img src="${reportEscape(new URL('img/LogoDPO.jpg', location.href).href)}" alt="DPO"></div>
    <div class="report-filters"><span class="report-chip">Casa Central + Dolores</span><span class="report-chip">Todas las áreas, sectores y auditores</span></div>
    <p class="report-meta">Emitido: ${reportEscape(new Date().toLocaleString('es-AR'))} · Fuente: ${reportEscape(status.textContent)}<br>Ambas sucursales se comparan en ${reportEscape(period)}. YTD y evolución: enero hasta el mes seleccionado.</p>
    <div class="report-scale"><b>Objetivo 80%</b><span>Verde ≥85%</span><span>Amarillo 70–84%</span><span>Rojo &lt;70%</span><span>“-” Sin datos</span></div></div>
    <nav class="report-nav" aria-label="Secciones del informe"><a href="#report-summary">Resumen</a><a href="#general-charts">Gráficos</a><a href="#general-rankings">Rankings</a><a href="#general-matrix-0">Casa Central</a><a href="#general-matrix-1">Dolores</a></nav>
    ${hasMonth ? '' : '<p class="report-empty">Sin auditorías en el mes seleccionado. El acumulado conserva los meses anteriores con datos.</p>'}
    <div id="report-summary">${heading('01', 'Comparativo de sucursales', 'Resultados del mes y acumulado anual.')}${summary}</div>
    <section class="report-section" id="general-charts">${heading('02', 'Gráficos comparativos', 'Resultado mensual, radar 5S y evolución con corte al mes seleccionado.')}${charts}</section>
    <section class="report-section" id="general-rankings">${heading('03', 'Rankings y oportunidades', 'Áreas, responsables y pilares 5S del acumulado.')}${rankings}</section>
    ${matrices}</body></html>`;
}
