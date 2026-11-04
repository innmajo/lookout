# Lookout · Análisis PESTEL

Herramienta para registrar factores del entorno externo, priorizarlos con un semáforo ponderado por sector y exportar un informe.

Los factores y la TRM viven en **Supabase** (Postgres + Auth), por **empresa**.

Roles: administrador del sistema (seed), administrador de empresa (registro), y usuarios operativos (digitador, supervisor, auditor, aprobador) creados por el admin de empresa.

El **sector se elige al registrar la empresa** y no se puede cambiar: fija pesos PESTEL y el color de la UI.

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

3. **Migraciones:** al push a `main` corre el Action, o en local `npm run db:push` (ver `supabase/README.md`).
4. Despliega la Edge Function de alta de usuarios: `npx supabase functions deploy crear-usuario`
5. (Opcional) Admin del sistema:
   `SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seed-admin-sistema.mjs`
6. En **Authentication → Providers**, deja Email habilitado. Para desarrollo puedes desactivar **Confirm email**.

**Partida limpia:** la migración de roles borra factores y perfiles. Conviene borrar también usuarios viejos en Authentication → Users y volver a registrar empresas.

| Ruta | Quién |
|---|---|
| `/usuarios` | Admin de empresa (crea digitador / supervisor / auditor / aprobador) |
| `/registro` | Roles operativos (solo digitador escribe) |
| `/configuracion` | Admin (TRM) y digitador (ejemplos) |

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
| `/login` | Entrar o registrar empresa (sector fijo al alta) |
| `/dashboard` | KPIs, gráficos, insights, matriz 3×3 y alertas |
| `/usuarios` | Alta de usuarios de la empresa (admin) |
| `/registro` | Formulario PESTEL y tabla (digitador escribe) |
| `/reportes` | Vista previa y descarga PDF / Excel / CSV |
| `/informacion` | Fórmulas, pesos por sector y matriz |
| `/configuracion` | TRM (admin), ejemplos/borrado (digitador) |

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
