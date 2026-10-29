# Supabase · Lookout

Las migraciones viven en `migrations/`. **No hace falta pegar SQL a mano** en el panel: al hacer push a `main`, GitHub Actions aplica lo pendiente.

## Flujo del equipo

1. Crear un archivo nuevo en `migrations/` con timestamp, por ejemplo:
   `20260329150000_agregar_campo_x.sql`
2. Commit + push a `main`
3. Revisar el Action **Supabase migrations** en GitHub → debe quedar en verde

## Secretos de GitHub (una sola vez)

En el repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Dónde sacarlo |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) → Generate |
| `SUPABASE_PROJECT_ID` | `pdhpqtgajvbvmfhblzhr` (ref del proyecto) |
| `SUPABASE_DB_PASSWORD` | La contraseña de la base que elegiste al crear el proyecto |

## Probar en local (opcional)

```bash
npx supabase login
npx supabase link --project-ref pdhpqtgajvbvmfhblzhr
npx supabase db push
```

Los archivos sueltos `schema.sql` / `migration_*.sql` son referencia histórica; la fuente de verdad es `migrations/`.
