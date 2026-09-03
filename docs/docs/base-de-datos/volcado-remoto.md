---
sidebar_position: 1
title: Volcado del servidor remoto
---

# Extraer la copia de seguridad remota

:::danger Operación sobre PRODUCCIÓN
Este procedimiento se conecta a la base de datos **de producción** con el usuario
`root`. Ese usuario ve unas 20 bases de datos de otros productos de Zertifier
(`zerticarbon`, `zertifarm`, `zertinft`, `zpassbolt`, …). Limita siempre el volcado
a `zertipower-prod` y no ejecutes escrituras.
:::

## Datos de conexión

Los valores concretos **no se documentan aquí a propósito**: son credenciales de
producción y esta documentación es un artefacto compartible. Consúltalos en el gestor
de secretos del equipo. Los parámetros necesarios son:

| Parámetro | Valor |
| --- | --- |
| Host | `<host-produccion>` |
| Puerto | `3306` |
| Usuario | `<usuario>` |
| Contraseña | `<password>` |
| Base de datos | `zertipower-prod` (opcionalmente `zertipower-dev`) |

El servidor remoto ejecuta **MariaDB 10.4.13** sobre Debian.

## Método recomendado: archivo de opciones

Pasar la contraseña en la línea de comandos la expone en el historial del shell y en
la lista de procesos. Usa un archivo de opciones con permisos restringidos:

```bash
mkdir -p .secrets && chmod 700 .secrets
```

Crea `.secrets/remote.cnf` con este contenido (rellenando los valores reales):

```ini
[client]
host=<host-produccion>
port=3306
user=<usuario>
password=<password>
```

```bash
chmod 600 .secrets/remote.cnf
```

Añade `.secrets/` a `.gitignore` **antes** de crear el archivo.

## Opción A — cliente local instalado

```bash
mysqldump --defaults-extra-file=.secrets/remote.cnf --single-transaction --quick --routines --triggers zertipower-prod > backup_zertipower_prod.sql
```

## Opción B — mediante Docker (sin cliente instalado)

Es la vía habitual en Windows, donde no suele existir `mysqldump` en el `PATH`:

```bash
docker run --rm -v "$(pwd)/.secrets:/cfg:ro" mariadb:10.11 mariadb-dump --defaults-extra-file=/cfg/remote.cnf --single-transaction --quick --routines --triggers zertipower-prod > backup_zertipower_prod.sql
```

:::note Git Bash en Windows
Git Bash reescribe las rutas que empiezan por `/`, y `/cfg/remote.cnf` se convierte en
`C:/Program Files/Git/cfg/remote.cnf`. Antepón `MSYS_NO_PATHCONV=1` al comando para
desactivar esa conversión.
:::

## Qué significan las banderas

| Bandera | Para qué sirve |
| --- | --- |
| `--single-transaction` | Volcado consistente sin bloquear las tablas InnoDB. Imprescindible en producción. |
| `--quick` | Lee fila a fila en vez de cargar la tabla entera en memoria. |
| `--routines` | Incluye procedimientos y funciones almacenadas. |
| `--triggers` | Incluye los triggers. |

## ¿Hace falta el volcado remoto?

**Para desarrollar en local, no.** El [seed mínimo](./seed-minimo) reconstruye el
esquema completo desde `prisma/schema.prisma` y no necesita acceso a producción.

El volcado remoto sólo es necesario si tienes que reproducir un problema con datos
reales o migrar el servidor.
