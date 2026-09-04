---
sidebar_position: 2
title: Trabajar con la base de datos
---

# Trabajar con la base de datos

La base de datos **forma parte del stack**: se levanta, se crea y se rellena sola con
`docker compose up -d`. No hay que instalar MariaDB ni importar nada a mano.

## Datos de conexión

| | |
| --- | --- |
| Host | `localhost` |
| Puerto | `3306` |
| Usuario | `root` |
| Contraseña | `root` |
| Base de datos | `zertipower-dev` |

Sirven para conectar con DBeaver, HeidiSQL, TablePlus o cualquier cliente SQL.

:::note Dos nombres para el mismo servidor
Desde tu máquina es `localhost`. Desde **dentro** de otro contenedor (por ejemplo el
backend) es `mariadb`, que es el nombre del servicio. Por eso el backend usa
`DB_HOST=mariadb` y no `127.0.0.1`: eso apuntaría a sí mismo.
:::

## Abrir una consola SQL

```bash
cd docker && docker compose exec mariadb mariadb -u root -proot zertipower-dev
```

## Cómo se rellena sola

MariaDB ejecuta automáticamente los `.sql` que encuentra en
`/docker-entrypoint-initdb.d` **la primera vez** que arranca, cuando su volumen está
vacío. El `docker-compose.yml` monta ahí `sql/seed_minimo.sql`.

Eso crea el esquema completo (39 tablas y 2 vistas) y los datos mínimos: un rol
`ADMIN` y otro `USER`, el usuario de prueba, una comunidad energética y dos CUPS.

:::warning Sólo la primera vez
Si el volumen ya tiene datos, el seed **no se vuelve a ejecutar**. Para volver a
cargarlo hay que borrar el volumen (ver abajo).
:::

## Empezar de cero

Borra los contenedores **y los datos**, y vuelve a levantar todo limpio:

```bash
cd docker && docker compose down -v
```

```bash
docker compose up -d
```

## Cargar un volcado de producción

Si necesitas trabajar con datos reales en lugar del seed mínimo:

```bash
cd docker && docker compose exec -T mariadb mariadb -u root -proot zertipower-dev < backup_zertipower_prod.sql
```

Ver [Volcado del servidor remoto](./volcado-remoto) para saber cómo obtener ese
archivo.

:::danger Datos reales en tu portátil
Un volcado de producción contiene datos personales de clientes. Bórralo cuando dejes
de necesitarlo y no lo subas a ningún sitio.
:::

## Hacer una copia de tu base de datos local

```bash
cd docker && docker compose exec mariadb mariadb-dump -u root -proot --single-transaction --routines --triggers zertipower-dev > copia-local.sql
```

## Cambiar la contraseña o el nombre de la base de datos

En el archivo `.env`:

```bash
DB_PASSWORD=otra-contraseña
DB_DATABASE=otro-nombre
```

Como la base de datos ya existe, hay que recrearla para que los valores nuevos surtan
efecto:

```bash
docker compose down -v && docker compose up -d
```
