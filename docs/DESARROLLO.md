# Desarrollo local

## Requisitos

- Node.js 22 o superior.
- MySQL 8. En Windows se puede usar una copia portable dentro del proyecto (`.local/`, que no se sube al repo).

## 1. Base de datos MySQL portable (Windows, sin instalador)

```bash
# Descargar y descomprimir MySQL 8.4 LTS en .local/
curl -L -o .local/mysql.zip https://dev.mysql.com/get/Downloads/MySQL-8.4/mysql-8.4.11-winx64.zip
unzip -q .local/mysql.zip -d .local && rm .local/mysql.zip
```

Crear `.local/my.ini` (ajusta la ruta del proyecto):

```ini
[mysqld]
basedir=D:/Proyectos/Lusarte_Web/.local/mysql-8.4.11-winx64
datadir=D:/Proyectos/Lusarte_Web/.local/mysql-data
port=3307
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
```

Inicializar una sola vez, arrancar y crear la base:

```bash
.local/mysql-8.4.11-winx64/bin/mysqld --defaults-file=.local/my.ini --initialize-insecure
npm run db:local          # deja MySQL corriendo en el puerto 3307 (otra terminal)
.local/mysql-8.4.11-winx64/bin/mysql -uroot -h127.0.0.1 -P3307 -e "
  CREATE DATABASE lusarte CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'lusarte'@'127.0.0.1' IDENTIFIED BY 'lusarte-dev';
  GRANT ALL ON lusarte.* TO 'lusarte'@'127.0.0.1';"
```

## 2. Variables de entorno

Copiar `.env.example` a `.env.local` y completar `AUTH_SECRET`.

## 3. Tablas, catálogo y usuario del panel

```bash
npm run db:migrate                                   # crea o actualiza las tablas
npm run db:seed                                      # carga data/catalogo/*.json (solo productos nuevos)
npm run db:seed -- --reset                           # borra el catálogo y lo carga de cero
npm run admin:create -- correo@ejemplo.com "clave de 10+ caracteres"   # crea el usuario o cambia su clave
```

## 4. Correr la web

```bash
npm run dev:local # http://localhost:3000 · panel en /admin (npm run dev compila y arranca en modo producción, como GoDaddy)
```

## Cambios en el esquema

1. Editar `src/lib/db/schema.ts`.
2. `npm run db:generate -- --name descripcion-del-cambio` genera la migración en `drizzle/`.
3. `npm run db:migrate` la aplica. Las migraciones se suben al repo y se aplican igual en el hosting.

## El catálogo inicial

`data/catalogo/*.json` es la transcripción del catálogo de Canva de la clienta (texto original en `docs/catalogo-canva/`). La carga inicial solo crea productos que no existen, así que no pisa lo que la clienta edite después en el panel.
