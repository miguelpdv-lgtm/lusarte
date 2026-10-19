# Hosting: GoDaddy Node.js Hosting

Resumen de lo que exige la plataforma (guía oficial de GoDaddy, recibida el 2026-10-17):

- Se sube el **código fuente** (zip o carpeta). GoDaddy corre `npm install --production`, `npm run build` y `npm start`.
  - Todo lo necesario para compilar (Tailwind, TypeScript y sus tipos) va en `dependencies`, no en `devDependencies`.
- **La vista previa corre `npm run dev`** (visto en el log del 2026-10-17). Por eso `dev` compila y arranca en modo producción (`next build --webpack && next start`); para desarrollar en local está `npm run dev:local`.
- **La vista previa pone `NODE_ENV=development`**: compilar así rompe el prerender ("Cannot read properties of null (reading 'useContext')"). Por eso `dev`, `build` y `start` pasan por `scripts/next.mjs`, que fuerza `NODE_ENV=production`. (El diagnóstico automático de GoDaddy sugirió bajar a Next 15: no hace falta, `next@16.3.6` existe en npm.)
- **Compilar con webpack, no con Turbopack**: Turbopack lanza un proceso aparte para el CSS que abre un puerto, y el contenedor lo prohíbe ("binding to a port: Permission denied"). `next build --webpack` procesa el CSS dentro del mismo proceso.
- **La revisión de estado prueba `/`**: el inicio no debe fallar aunque la base no responda.
- La app escucha en `process.env.PORT` y en `0.0.0.0`: `next start -H 0.0.0.0`.
- **MySQL administrado**: GoDaddy inyecta `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD` (`src/lib/db/client.ts` los usa si no hay `DATABASE_URL`). Preview y producción comparten la misma base. Se puede importar un `.sql` de hasta 100 MB, y eso reemplaza las tablas.
- **No se sube `.env`**: los secretos (`AUTH_SECRET` y, más adelante, Wompi y Resend) se cargan en la interfaz.
- **Disco**: solo sobreviven a un redeploy `public/assets` (servida en la web) y `/private` (privada). Las fotos del panel van a `public/assets/uploads`.
- **Red de salida**: solo se permiten los puertos 80 y 443, más la base de GoDaddy. Wompi y Resend usan HTTPS, así que no hay problema.
- Paquetes solo del registro público de npm. No subir un `.npmrc` privado.

## Armar el zip

Se incluyen `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `src/`, `public/` y `drizzle/`, más las fotos en `public/assets/uploads/`. No se incluyen `node_modules`, `.next`, `.env*`, `.local`, `data` ni `docs`.

## Cambios de esquema en producción

Generar la migración en local (`npm run db:generate`) y aplicar su SQL desde la interfaz de la base de GoDaddy, sin pisar los datos.

## Exportar el zip

`npm run zip:godaddy` → `.local/deploy/lusarte-godaddy.zip` (código fuente + fotos de `.local/uploads` en `public/assets/uploads/`). La base va aparte: `.local/deploy/lusarte-base.sql`, que se importa desde la interfaz con la app ya corriendo.
