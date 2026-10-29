# Lookout · Análisis PESTEL

Herramienta para registrar factores del entorno externo, priorizarlos con un semáforo ponderado por sector y exportar un informe.

Los factores y la TRM viven en **Supabase** (Postgres + Auth). El tema y el sector de la organización siguen en el navegador.

## Requisitos

1. Proyecto en [supabase.com](https://supabase.com)
2. Node.js 20+

## Configurar Supabase

1. En el dashboard: **Project Settings → API**. Copia `Project URL` y `anon` `public` key.
2. Copia el entorno local:

```bash
cp .env.example .env.local
```

Completa:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

3. En **SQL Editor**, ejecuta el contenido de `supabase/schema.sql` (tablas `perfiles` y `factores`, RLS y trigger de perfil).
4. En **Authentication → Providers**, deja Email habilitado. Para desarrollo puedes desactivar **Confirm email** si no quieres verificar correo.

## Cómo correr el proyecto

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Sin `.env.local` verás una pantalla de configuración.

Producción:

```bash
npm run build
npm run preview
```

## Módulos

| Ruta | Uso |
|---|---|
| `/login` | Entrar o crear cuenta |
| `/dashboard` | KPIs, gráficos, insights, matriz 3×3 y alertas |
| `/registro` | Formulario PESTEL, tabla con filtros y edición |
| `/reportes` | Vista previa y descarga PDF / Excel / CSV |
| `/informacion` | Fórmulas, pesos por sector y matriz |
| `/configuracion` | TRM, ejemplos, borrado |

## Regla del semáforo

`base = valorImpacto × valorPlazo`

`puntaje = round(base × (pesoCategoria / PESO_MEDIO), 1)`

- Impacto: Alto = 3, Medio = 2, Bajo = 1
- Plazo: Corto = 3, Mediano = 2, Largo = 1
- El peso depende del sector del factor (`src/lib/sectores.ts`)

| Puntaje | Nivel | Acción |
|---|---|---|
| ≥ 9 | CRÍTICO | Urgente, actuar ya |
| ≥ 4 | ATENCIÓN | Planificar |
| &lt; 4 | MONITOREAR | Seguimiento |

La matriz 3×3 del dashboard usa solo `impacto × plazo` (sin peso). El badge del factor sí aplica el peso. Detalle en `/informacion` y `src/lib/prioridad.ts`.
