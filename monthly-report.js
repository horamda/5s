// Capture the existing charts and tables so the report uses dashboard calculations.
function reportEscape(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

function reportClone(element) {
  const clone = element.cloneNode(true);
  const originals = element.querySelectorAll('canvas');
  clone.querySelectorAll('canvas').forEach((canvas, index) => {
    const image = document.createElement('img');
    image.src = originals[index].toDataURL('image/png');
    image.alt = originals[index].closest('.card').querySelector('h3').textContent;
    image.className = 'report-chart';
    canvas.replaceWith(image);
  });
  clone.querySelectorAll('table').forEach(table => {
    if (!table.parentElement.classList.contains('scroll')) {
      const scroll = document.createElement('div');
      scroll.className = 'scroll';
      table.replaceWith(scroll);
      scroll.append(table);
    }
  });
  clone.querySelectorAll('.scroll').forEach(scroll => {
    scroll.setAttribute('tabindex', '0');
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', scroll.closest('.card')?.querySelector('h3')?.textContent || 'Tabla de resultados');
  });
  return clone.outerHTML;
}

function monthlyReportHtml() {
  const year = +fy.value;
  const rows = filtered().filter(row => row.anio === year);
  const month = fm.value ? +fm.value.split('|')[0] : Math.max(...rows.map(row => row.mes), 1);
  const period = `${MONTHS[month - 1]} ${year}`;
  const title = `Reporte 5S · ${branch} · ${period}`;
  const cutoffRows = rows.filter(row => row.mes <= month);
  const monthRows = cutoffRows.filter(row => row.mes === month);
  const savedView = view, savedMonth = fm.value;
  const savedStyle = dashboardView.getAttribute('style');
  let summary, areas, sectors, findings;
  try {
    dashboardView.style.width = '1280px';
    dashboardView.style.maxWidth = 'none';
    // Freeze the selected month even if the last available audit is earlier.
    fm.value = `${month}|${MONTHS[month - 1]}`;
    view = 'areas';
    update(cutoffRows);
    if (!monthRows.length) barsMonth.innerHTML = '<small>Sin auditorías en el mes seleccionado</small>';
    const kpis = reportClone(dashboardView.querySelector('.kpis'));
    const pillars = reportClone(barsMonth.closest('.grid3'));
    summary = kpis + (cutoffRows.length ? pillars : '');
    areas = annualWinnersHtml(DATA, year, [branch], 'areas', month) + reportClone(matrix.closest('.card')) +
      reportClone(rankMain.closest('.grid3')) +
      reportClone(monthlyWinners.closest('.card')) +
      reportClone(trend.closest('.card'));
    findings = reportClone(detail.closest('.card'));
    view = 'sectores';
    update(cutoffRows);
    sectors = annualWinnersHtml(DATA, year, [branch], 'sectores', month) + reportClone(matrix.closest('.card')) +
      `<div class="grid2">${reportClone(rankMain.closest('.card'))}${reportClone(rankSecond.closest('.card'))}</div>` +
      reportClone(monthlyWinners.closest('.card')) + reportClone(trend.closest('.card'));
  } finally {
    view = savedView;
    fm.value = savedMonth;
    if (savedStyle === null) dashboardView.removeAttribute('style');
    else dashboardView.setAttribute('style', savedStyle);
    update();
  }
  const escaped = reportEscape;
  const source = status.textContent;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="about:srcdoc">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escaped(title)}</title><style>${monthlyReportStyles()}</style></head><body>
    <div class="report-head"><div class="report-brand"><div><p class="report-eyebrow">Del Palacio · Informe mensual 5S</p><h1>${escaped(branch)}</h1><p class="report-period">${escaped(period)}</p></div><img src="${escaped(new URL('img/LogoDPO.jpg', location.href).href)}" alt="DPO"></div>
    <div class="report-filters">${[fa.value ? `Área: ${fa.value}` : 'Todas las áreas', fs.value ? `Sector: ${fs.value}` : 'Todos los sectores', fu.value ? `Auditor: ${fu.value}` : 'Todos los auditores'].map(label => `<span class="report-chip">${escaped(label)}</span>`).join('')}</div>
    <p class="report-meta">Emitido: ${escaped(new Date().toLocaleString('es-AR'))} · Fuente: ${escaped(source)}<br>
    YTD: enero a ${escaped(MONTHS[month - 1])}. Matrices y evolución con corte en el mes seleccionado.</p>
    <div class="report-scale"><b>Objetivo 80%</b><span><i class="dot" style="background:#2e9d50"></i>≥85%</span><span><i class="dot" style="background:#e5ad18"></i>70–84%</span><span><i class="dot" style="background:#d93c31"></i>&lt;70%</span><span>“–” Sin datos</span></div></div>
    <nav class="report-nav" aria-label="Secciones del informe"><a href="#report-summary">Resumen</a><a href="#report-areas">Áreas</a><a href="#report-sectors">Sectores</a><a href="#report-findings">Hallazgos</a></nav>
    ${monthRows.length ? '' : '<p class="report-empty">Sin auditorías en el mes seleccionado para estos filtros. El acumulado incluye únicamente los meses anteriores con datos.</p>'}
    <div class="report-section-head" id="report-summary"><span class="report-number">01</span><div><h2>Resumen de resultados</h2><p>Desempeño del mes y acumulado anual.</p></div></div>${summary}
    ${monthRows.length ? '' : '<p>Los gráficos del mes sin auditorías no representan un resultado evaluado.</p>'}
    <section class="report-section" id="report-areas"><div class="report-section-head"><span class="report-number">02</span><div><h2>Resultados por área</h2><p>Matriz mensual, responsables, ranking y evolución.</p></div></div>${areas}</section>
    <section class="report-section" id="report-sectors"><div class="report-section-head"><span class="report-number">03</span><div><h2>Resultados por sector</h2><p>Sectores agrupados por área.<span class="report-scroll-hint"> Deslizá las tablas para ver todos los meses.</span></p></div></div>${sectors}</section>
    <section class="report-section" id="report-findings"><div class="report-section-head"><span class="report-number">04</span><div><h2>Auditorías y hallazgos</h2><p>Observaciones y acciones registradas en ${escaped(period)}.</p></div></div>
    <p class="report-footnote">Los resultados son promedios de las auditorías disponibles para los filtros seleccionados. La ausencia de datos no equivale a un resultado de 0%.</p>${monthRows.length ? findings : '<p>Sin auditorías para mostrar.</p>'}</section>
    </body></html>`;
}

function openMonthlyReport() {
  const isGeneral = generalView.classList.contains("active");
  if (!(isGeneral ? document.getElementById("generalYear").value : fy.value)) {
    alert('Seleccioná un año con datos para generar el reporte.');
    return;
  }
  let dialog = document.getElementById('monthlyReportDialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'monthlyReportDialog';
    dialog.setAttribute('aria-label', 'Vista previa del reporte mensual');
    dialog.innerHTML = '<div class="report-toolbar"><div><h2>Informe mensual 5S</h2><p id="reportPreviewPeriod"></p></div><div class="report-actions"><button class="report-print" id="printMonthlyReport" disabled>Imprimir / Guardar PDF</button><button id="closeMonthlyReport" autofocus>Cerrar</button></div></div><p class="report-help">Vista previa · Para descargar el informe, elegí “Guardar como PDF” en la ventana de impresión.</p><iframe class="report-preview" title="Reporte mensual 5S" sandbox="allow-same-origin allow-modals"></iframe>';
    document.body.append(dialog);
    dialog.querySelector('#closeMonthlyReport').onclick = () => dialog.close();
    dialog.querySelector('#printMonthlyReport').onclick = () => {
      const frame = dialog.querySelector('iframe');
      frame.contentWindow.focus();
      frame.contentWindow.print();
    };
  }
  const printButton = dialog.querySelector('#printMonthlyReport');
  const frame = dialog.querySelector('iframe');
  printButton.disabled = true;
  frame.onload = () => { printButton.disabled = false; };
  frame.srcdoc = isGeneral ? generalMonthlyReportHtml() : monthlyReportHtml();
  dialog.querySelector('#reportPreviewPeriod').textContent = `${branch} · ${fm.value ? MONTHS[+fm.value.split('|')[0] - 1] : MONTHS[Math.max(...filtered().filter(row => row.anio === +fy.value).map(row => row.mes), 1) - 1]} ${fy.value}`;
  if (isGeneral) {
    const {year, month} = generalPeriod();
    dialog.querySelector("#reportPreviewPeriod").textContent = `General | ${MONTHS[month - 1]} ${year}`;
  }
  dialog.showModal();
}

function monthlyReportStyles() {
  return `${document.querySelector('style').textContent}
    body{background:#edf2f7;padding:28px;color:#263445;max-width:1400px;margin:auto}
    .report-head{background:#fff;border:1px solid #d8e0e8;border-top:5px solid #173b63;border-radius:12px;margin-bottom:24px;padding:24px}
    .report-brand{display:flex;justify-content:space-between;align-items:center;gap:16px}
    .report-brand img{width:130px;height:48px;object-fit:contain}
    .report-eyebrow{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#52718e;margin:0 0 8px}
    h1{font-size:30px;color:#173b63;margin:4px 0;line-height:1.2}h2{font-size:21px;color:#173b63;margin:0}
    .report-period{font-size:18px;color:#52718e;margin:8px 0 0}
    .report-filters{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 14px}
    .report-chip{background:#f0f5fa;border:1px solid #dce5ed;border-radius:6px;padding:6px 9px;font-size:11px;line-height:1.4;overflow-wrap:anywhere}
    .report-section-head{display:flex;align-items:center;gap:12px;margin:26px 0 14px;break-after:avoid}
    .report-nav{display:flex;gap:6px;overflow-x:auto;position:sticky;top:0;z-index:3;background:#edf2f7;padding:10px 0;margin-bottom:8px}
    .report-nav a{flex-shrink:0;text-decoration:none;color:#173b63;border:1px solid #cedae6;border-radius:7px;background:#fff;padding:10px 14px;font-size:12px;font-weight:700;min-height:38px}
    .report-nav a:hover{background:#e3edf7}.report-nav a:focus-visible{outline:2px solid #2d6ea6;outline-offset:-2px}
    #report-summary,.report-section{scroll-margin-top:70px}
    .report-number{background:#173b63;color:white;border-radius:8px;padding:9px;font-size:12px;font-weight:800}
    .report-section-head p{margin:4px 0 0;color:#617388;font-size:12px}
    p{font-size:12px;line-height:1.6}.report-meta{color:#526174;font-size:11px;margin:0}.report-empty{padding:14px;background:#fff4d6;border:1px solid #e5ad18;border-radius:8px}
    .report-scale{display:flex;gap:8px 18px;flex-wrap:wrap;align-items:center;border-top:1px solid #e0e7ee;margin-top:16px;padding-top:14px;font-size:11px;color:#526174}
    .report-scale b{color:#173b63}.report-footnote{color:#617388;font-size:11px}
    .card{margin-bottom:14px;box-shadow:none;border-color:#d8e0e8;border-radius:10px;padding:18px;text-align:left;min-width:0}
    .card h3{text-align:left;color:#294762;font-size:14px;margin-bottom:16px}
    .scroll{max-height:none!important;overflow:auto;border-radius:6px}.scroll:focus-visible{outline:2px solid #2d6ea6;outline-offset:2px}
    .canvas{height:auto;min-height:0}.report-chart{width:100%;height:auto;display:block}
    table{table-layout:fixed}td,th{overflow-wrap:anywhere;padding:8px 6px;border-color:#d3dde7}thead{display:table-header-group}
    thead th,.rank th,.detail th{background:#e9f0f7;color:#173b63;font-size:10px}
    tbody tr:nth-child(even) td:not(.area-almacen):not(.area-flota):not(.area-oficinas){background:#f8fafc}
    #matrix thead th,.detail th{position:static}.matrix-area{width:9%}#matrix thead th:nth-child(2){width:16%}
    #matrix{min-width:1000px}.detail{min-width:850px}.rank{min-width:280px}
    .bar-name{white-space:normal;overflow:visible}.fill{print-color-adjust:exact}
    .grid3{grid-template-columns:repeat(3,minmax(0,1fr))}.grid2{grid-template-columns:repeat(2,minmax(0,1fr))}
    .kpis{grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-bottom:16px}
    .kpi{border:1px solid #d8e0e8;border-top:3px solid #2d6ea6;min-height:92px;padding:15px;text-align:left}
    .kpi small{font-size:11px;line-height:1.4}.kpi strong{font-size:27px;margin-top:10px}
    .winners{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:0}.winner{box-shadow:none;border-color:#d8e0e8;border-top-color:#2e9d50}
    .bar{grid-template-columns:minmax(75px,1fr) minmax(60px,1fr) 35px;font-size:10px}
    .detail th:nth-child(7),.detail th:nth-child(8){width:22%}.detail th:nth-child(3){width:12%}.detail td{font-size:10px}
    @media screen and (max-width:900px){body{padding:18px}.grid3,.grid2{grid-template-columns:1fr}.kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.report-chart{max-height:360px;object-fit:contain}.report-head{padding:20px}}
    @media screen and (max-width:540px){body{padding:12px}.report-head{padding:16px;margin-bottom:18px}.report-brand{align-items:flex-start}.report-brand img{width:76px;height:34px}h1{font-size:24px}.report-period{font-size:16px}.report-eyebrow{font-size:9px;letter-spacing:1px}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.kpi:last-child{grid-column:1/-1}.kpi{min-height:80px;padding:12px}.kpi strong{font-size:25px}.card{padding:14px}.winners{grid-template-columns:repeat(2,minmax(0,1fr))}.report-section-head{align-items:flex-start}h2{font-size:18px}.report-section-head p{font-size:11px}.report-scale{gap:9px 12px}.bar{grid-template-columns:minmax(95px,1fr) minmax(70px,1fr) 35px}}
    @page{size:A4 landscape;margin:12mm}
    @media print{html,body{overflow:visible;padding:0;width:auto;background:white}*{print-color-adjust:exact;-webkit-print-color-adjust:exact}
      .report-nav,.report-scroll-hint{display:none}
      .scroll{overflow:visible;border-radius:0}#matrix,.detail,.rank{min-width:0}.report-head{padding:10px;margin-bottom:10px;border-radius:0}
      h1{font-size:22px}.report-period{font-size:14px;margin-top:4px}.report-filters{margin:7px 0}.report-chip{padding:3px 7px}.report-scale{margin-top:7px;padding-top:7px}.report-eyebrow{margin-bottom:4px}.report-brand img{width:110px;height:38px}
      .report-section-head{margin:14px 0 10px}.report-section-head h2{font-size:18px}.report-section-head p{font-size:10px}
      .report-section{break-before:page}.card{break-inside:auto}.grid2,.grid3,.kpis,.winners,.canvas,.report-head{break-inside:avoid}
      tr{break-inside:avoid}h2,h3{break-after:avoid}.kpi{min-height:60px;padding:8px}.kpi strong{font-size:23px;margin-top:6px}
      .report-chart{max-height:250px;object-fit:contain}.grid3 .report-chart{max-height:260px}.card{padding:10px}th,td{font-size:9px;padding:5px 3px}
      .winners{grid-template-columns:repeat(6,minmax(0,1fr))}.winner{padding:7px}.winner b{font-size:12px}.winner small{font-size:9px}.winner span{font-size:10px}
      #matrix thead th{font-size:8px;overflow-wrap:normal}.report-footnote{font-size:10px;margin:6px 0 10px}}
    @media print{.detail td{font-size:9px;line-height:1.2;padding:4px 3px}}
    `;
}
