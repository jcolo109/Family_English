# Family English

Aplicación para aprender vocabulario en inglés jugando en grupo: un organizador mantiene una lista de palabras, cada jugador recibe 5 palabras nuevas al día, hace un examen diario de 10 preguntas y compite en la clasificación de su grupo.

- Análisis funcional: [docs/analisis-v1.md](docs/analisis-v1.md)
- Pantallas y sistema visual: [docs/pantallas-v1.md](docs/pantallas-v1.md)

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `app/` | Frontend: PWA con React, TypeScript, Vite y Tailwind. Se despliega en Vercel. |
| `supabase/migrations/` | Esquema de PostgreSQL, funciones y políticas de seguridad (RLS). Se aplica en Supabase. |
| `docs/` | Documentación del proyecto y fuentes del diseño. |

## Puesta en marcha

### 1. Base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com) (región Europa Occidental si los usuarios están en España).
2. En **SQL Editor**, ejecuta el contenido de `supabase/migrations/0001_esquema.sql`.
3. En **Database > Extensions**, activa `pg_cron`. Después ejecuta `supabase/migrations/0002_reparto_programado.sql`.
4. Ejecuta `supabase/migrations/0003_vocabulario_y_reparto.sql` (alta de palabras y reparto bajo demanda). Las migraciones se aplican en orden y cada una una sola vez.
5. En **Authentication > URL Configuration**, añade la URL de Vercel y `http://localhost:5173` a *Redirect URLs* (necesario para el enlace de recuperación de contraseña).
6. Opcional para desarrollo: en **Authentication > Providers > Email**, desactiva *Confirm email* para entrar sin confirmar el correo. Supabase rechaza emails de dominios ficticios (`example.com`, `.test`), así que las cuentas de prueba necesitan un buzón real; los alias del tipo `nombre+prueba1@gmail.com` sirven.

### 2. Frontend en local

```bash
cd app
cp .env.example .env.local   # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (Project Settings > API)
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

### 3. Despliegue (Vercel)

1. En Vercel, **Add New > Project** e importa el repositorio de GitHub.
2. En *Root Directory* elige `app`. El framework se detecta como Vite.
3. En *Environment Variables* añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Cada push a `main` vuelve a desplegar.

## Estado

Implementado: acceso (inicio de sesión, registro, recuperación de contraseña), mis grupos con aceptación de invitaciones, crear grupo, invitar (con enlace de invitación copiable), inicio del grupo con reparto diario, palabras del día (tarjetas) y vocabulario del organizador (alta, edición, archivo e importación CSV). El esquema de base de datos cubre todo el MVP.

Pendiente: envío de invitaciones por email, examen con corrección en servidor, resultado, clasificación completa, repaso, historial, miembros y perfil. Las rutas existen como marcadores para que la navegación funcione.

Rutas: `/` acceso · `/grupos` mis grupos · `/grupos/nuevo` · `/invitacion/:token` · `/g/:id` inicio del grupo · `/g/:id/palabras` · `/g/:id/vocabulario` · `/g/:id/invitar` · `/g/:id/miembros` · `/g/:id/examen` · `/g/:id/resultado` · `/g/:id/ranking` · `/g/:id/repaso` · `/g/:id/historial` · `/perfil`.
