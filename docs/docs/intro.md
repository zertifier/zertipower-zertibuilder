---
sidebar_position: 1
title: Inicio rápido
slug: /
---

# Poner en marcha todo el sistema

**Sólo necesitas Docker.** No hace falta instalar Node, ni npm, ni MariaDB, ni
cargar la base de datos a mano.

## 1. Instala Docker

Descárgalo de [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) e
instálalo. En Windows y macOS es Docker Desktop; ábrelo y espera a que arranque.

## 2. Descarga el proyecto

```bash
git clone https://github.com/zertifier/zertipower-zertibuilder.git
```

```bash
cd zertipower-zertibuilder
```

## 3. Arranca

Elige **una** de las dos opciones. Hacen lo mismo.

### Opción A — el instalador (te va preguntando)

En **Linux o macOS**:

```bash
./setup.sh
```

En **Windows**, haz doble clic en `setup.bat`, o desde la terminal:

```bash
setup.bat
```

Te preguntará los puertos (puedes pulsar INTRO para aceptar los que trae por
defecto), generará el archivo de configuración y arrancará todo.

### Opción B — un solo comando

Si te sirven los valores por defecto, no hace falta configurar nada:

```bash
cd docker && docker compose up -d
```

:::note ¿Por qué `cd docker`?
El archivo `docker-compose.yml` está en la carpeta `docker/` y no en la raíz
a propósito: el pipeline de despliegue del servidor ejecuta `docker compose`
dentro de `frontend/` y `calculadora/`, y Docker busca el archivo de
configuración subiendo por las carpetas superiores. Un compose en la raíz del
repositorio le tapaba el suyo y rompía los despliegues.
:::

## 4. Listo

La primera vez tarda varios minutos: tiene que descargar y compilar todo. Cuando
termine, ya está funcionando:

| Módulo | Dirección |
| --- | --- |
| **Panel de Administración** | [http://localhost:4201](http://localhost:4201) |
| **Calculadora** | [http://localhost:4202](http://localhost:4202) |
| API (Swagger) | [http://localhost:3000/api](http://localhost:3000/api) |
| Base de datos | `localhost:3306` (`root` / `root`) |

Entra en el Panel de Administración con:

| Usuario | Contraseña |
| --- | --- |
| `admin` | `admin123` |

:::tip La base de datos se rellena sola
No tienes que importar nada. La primera vez que arranca, MariaDB ejecuta el seed
automáticamente y crea el esquema completo, el usuario de prueba, una comunidad
energética y dos CUPS.
:::

## Comandos que vas a necesitar

Todos estos comandos se ejecutan desde la carpeta `docker/`.

Ver si todo está en marcha:

```bash
docker compose ps
```

Ver qué está pasando (útil si algo falla):

```bash
docker compose logs -f
```

Parar el sistema:

```bash
docker compose down
```

Empezar de cero, **borrando también la base de datos**:

```bash
docker compose down -v
```

Después de cambiar código, reconstruir:

```bash
docker compose up -d --build
```

## ¿Y el Contador / Smart Meter?

No se levanta por defecto porque necesita credenciales del registro privado de npm
de Zertifier y, aunque se construya, sólo permite entrar con Google contra un
servicio externo. Si tienes acceso:

```bash
cd docker && docker compose --profile smart-meter up -d
```

Ver [Contador / Smart Meter](./configuracion/contador) para el detalle.

## Si algo va mal

Casi todos los problemas habituales están en
[Solución de problemas](./troubleshooting), con la causa y el comando exacto para
arreglarlos.

## Siguientes pasos

- [Arquitectura](./arquitectura/repositorios) — qué es cada módulo.
- [Configuración](./configuracion/variables-entorno) — cambiar puertos, conectar
  servicios externos, credenciales.
- [Desplegar en un servidor](./despliegue/servidor-nuevo) — con dominio y HTTPS.
