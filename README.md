# Lookout · Análisis PESTEL

Herramienta para registrar factores del entorno externo, priorizarlos con un semáforo y exportar un informe.

Los datos se guardan en el navegador (`localStorage`). No hay backend.

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Para producción:

```bash
npm run build
npm run preview
```

## Módulos

| Ruta | Uso |
|---|---|
| `/dashboard` | KPIs, gráficos, insights, matriz 3×3 y alertas urgentes |
| `/registro` | Formulario PESTEL, tabla con filtros y edición |
| `/reportes` | Vista previa y descarga PDF / Excel / CSV |
| `/configuracion` | Cargar datos de ejemplo o borrar todo |

## Regla del semáforo

`puntaje = valorImpacto × valorPlazo`

- Impacto: Alto = 3, Medio = 2, Bajo = 1
- Plazo: Corto = 3, Mediano = 2, Largo = 1

| Puntaje | Nivel | Acción |
|---|---|---|
| 9 | CRÍTICO | Urgente, actuar ya |
| 4–6 | ATENCIÓN | Planificar |
| 1–3 | MONITOREAR | Seguimiento |

La lógica vive en `src/lib/prioridad.ts` (`calcularPrioridad`).
