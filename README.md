# Dashboard DPO 5S

Dashboard web para seguimiento de auditorias 5S de Del Palacio S.A.

## Ejecutar localmente

```bash
npm install
npm start
```

Luego abrir:

```text
http://localhost:3000
```

## Deploy en Railway

1. Subir este proyecto a GitHub.
2. En Railway, crear un nuevo proyecto desde ese repositorio.
3. Railway detecta Node.js con Nixpacks.
4. El comando de inicio es:

```bash
npm start
```

5. Healthcheck configurado:

```text
/health
```

No hace falta configurar variables de entorno. Railway inyecta `PORT` automaticamente y el servidor lo usa.

## Reporte mensual por sucursal

En Casa Central o Dolores, seleccionar año, mes y los filtros deseados, y pulsar **Reporte del mes**. La vista previa incluye ambas solapas: resumen de indicadores y 5S, matrices por área y sector, rankings, ganadores, evolución y hallazgos del mes.

El reporte respeta los filtros de área, sector y auditor. El acumulado YTD y los gráficos se cortan en el mes seleccionado; si se deja el mes automático, se usa el último mes disponible para esos filtros. Al cerrar, se conservan la solapa y los filtros originales.

La vista previa incluye navegación entre secciones y tablas desplazables en celulares. **Imprimir / Guardar PDF** abre la impresión del navegador, preparada para A4 horizontal con tablas completas. Elegir **Guardar como PDF** para descargarlo. El encabezado identifica la sucursal, el período, los filtros y el estado de la fuente de datos.
