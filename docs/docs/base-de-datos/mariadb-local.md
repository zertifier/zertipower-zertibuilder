---
sidebar_position: 2
title: MariaDB local con Docker
---

# Levantar MariaDB en local

## El archivo `docker-compose.db.yml`

En la raíz del proyecto (`Ris3Cat/`):

```yaml
services:
  mariadb-local:
    image: mariadb:10.11
    container_name: mariadb-zertipower-local
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: zertipower-dev
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 5s
      timeout: 5s
      retries: 20

volumes:
  mariadb_data:
    driver: local
```

:::note Diferencias respecto a la especificación original
- Se ha omitido la clave `version: '3.8'`: está obsoleta en Docker Compose v2 y
  provoca un aviso en cada ejecución.
- Se ha añadido un `healthcheck`, que permite esperar a que la base de datos esté
  realmente lista antes de restaurar. Sin él, restaurar demasiado pronto falla.
:::

## Arranque

```bash
docker compose -f docker-compose.db.yml up -d
```

Esperar a que el contenedor esté sano:

```bash
docker inspect --format='{{.State.Health.Status}}' mariadb-zertipower-local
```

Cuando devuelva `healthy`, la base de datos acepta conexiones.

## Restaurar un volcado

Para restaurar el volcado completo de producción:

```bash
docker exec -i mariadb-zertipower-local mariadb -u root -proot zertipower-dev < backup_zertipower_prod.sql
```

Para el entorno de desarrollo habitual, usa en su lugar el
[seed mínimo](./seed-minimo), que es autocontenido:

```bash
docker exec -i mariadb-zertipower-local mariadb -u root -proot < sql/seed_minimo.sql
```

## Versiones: 10.4 en producción, 10.11 en local

Producción ejecuta **MariaDB 10.4.13** y en local usamos **10.11**. Restaurar un
volcado de 10.4 en 10.11 funciona (la compatibilidad hacia adelante está soportada),
pero conviene tenerlo presente: lo contrario —restaurar un volcado de 10.11 en un
10.4— **no** está garantizado.

## Comandos útiles

Abrir una consola SQL:

```bash
docker exec -it mariadb-zertipower-local mariadb -u root -proot zertipower-dev
```

Ver los registros del contenedor:

```bash
docker logs --tail 50 mariadb-zertipower-local
```

Borrar la base de datos y empezar de cero (**destruye los datos locales**):

```bash
docker compose -f docker-compose.db.yml down -v
```
