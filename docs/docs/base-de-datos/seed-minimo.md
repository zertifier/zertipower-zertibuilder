---
sidebar_position: 3
title: Seed mínimo
---

# El seed mínimo (`sql/seed_minimo.sql`)

Un único archivo SQL que deja un entorno de desarrollo funcional partiendo de una
base de datos **completamente vacía**, sin acceso al servidor de producción.

## Qué contiene

| Elemento | Cantidad |
| --- | --- |
| Esquema (tablas) | 39 |
| Vistas | 2 |
| Roles | 2 — `ADMIN` y `USER` |
| Usuarios | 1 administrador de prueba |
| Comunidades energéticas | 1 |
| CUPS / smart meters | 2, vinculados a la comunidad |
| Catálogos de apoyo | 1 localidad, 1 proveedor, 1 cliente |

## Aplicarlo

```bash
docker exec -i mariadb-zertipower-local mariadb -u root -proot < sql/seed_minimo.sql
```

El archivo es autocontenido: crea la base de datos (`CREATE DATABASE IF NOT EXISTS`),
selecciona el esquema y luego inserta los datos. No requiere ningún paso previo más
allá de tener el contenedor levantado.

## Credenciales de desarrollo

| Campo | Valor |
| --- | --- |
| Usuario | `admin` |
| Email | `admin@zertipower.local` |
| Contraseña | `admin123` |
| Rol | `ADMIN` |

El login acepta **indistintamente el nombre de usuario o el email**: el controlador
busca primero por `username` y, si no encuentra nada, por `email`.

La contraseña se almacena como hash **bcrypt con coste 14**, que es exactamente lo
que genera `PasswordUtils.encrypt()` (`bcrypt.hash(password, 14)`). Para generar un
hash distinto:

```bash
node -e "require('bcrypt').hash('tu-password',14).then(console.log)"
```

## De dónde sale el esquema

:::warning No uses `backend/backups/database.sql`
Ese volcado versionado en el repositorio **está obsoleto**. Comparado con el código
actual le faltan **15 tablas** (`energy_hourly`, `energy_realtime`, `trades`,
`notifications`, `proposals`, `votes`, `shares`, `stripe`, …) y la columna
`users.customer_id`.

Si construyes la base de datos con él, el backend **arranca y se cae** con:

```
Error: Unknown column 'users.customer_id' in 'ON'
```
:::

El esquema del seed se ha regenerado desde **`prisma/schema.prisma`**, que es la
fuente de verdad del backend:

```bash
npx prisma db push
```

Para reconstruirlo desde cero tras un cambio de modelo:

```bash
docker exec mariadb-zertipower-local mariadb -u root -proot -e "DROP DATABASE IF EXISTS \`zertipower-dev\`; CREATE DATABASE \`zertipower-dev\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

```bash
cd zertipower-zertibuilder/backend && npx prisma db push
```

## Las dos vistas hay que crearlas aparte

`prisma db push` **no crea las vistas**: no están declaradas como modelos. Sus
definiciones viven en `backend/prisma/views/zertipower-dev/`:

- `energy_registers_original_hourly.sql`
- `energy_registers_original_monthly.sql`

El código las consulta (por ejemplo en `energy-registers-hourly.controller.ts`), así
que si faltan esos endpoints fallan. El `seed_minimo.sql` ya las incluye; si
reconstruyes el esquema a mano, aplícalas con `CREATE OR REPLACE VIEW`.

## Integridad referencial

El esquema tiene sólo **5 claves foráneas reales**:

```
users.role_id                → roles.id
user_oauth.user_id           → users.id
role_permission.role_id      → roles.id
role_permission.permission_resource → permissions.resource
role_permission.permission_action   → permissions.action
```

La tabla `cups` **no tiene ninguna FK**: `community_id`, `provider_id`,
`location_id` y `customer_id` son referencias "blandas" con valor por defecto `0`.
Por eso es fácil dejar CUPS huérfanos sin que la base de datos proteste. El seed
inserta las filas de apoyo (localidad, proveedor, cliente) para que todos los joins
del panel resuelvan correctamente.
