---
sidebar_position: 4
title: Contador / Smart Meter
---

# Contador / Smart Meter

Este módulo **no se levanta con el arranque estándar**. Esta página explica por qué
y qué hace falta para incluirlo.

## Por qué está fuera por defecto

### 1. Depende de un registro privado de npm

Usa dos paquetes que no están en el registro público:

- `@zertifier/rx-store`
- `@zertifier/zertiauthjs`

Vienen de `verdaccio.zertifier.com`, que requiere autenticación. Sin un token
válido, la construcción falla con:

```
npm error code E401
npm error Unable to authenticate, your authentication token seems to be invalid.
```

:::warning El token del repositorio no sirve
El archivo `.npmrc` versionado en el repositorio `ris3cat-smart-meter` contiene un
token que **ya no es válido**. Además, al estar en un repositorio público, ese token
está expuesto y debería rotarse. Ver [Gestión de secretos](./secretos).
:::

### 2. No se puede usar en un entorno local aislado

La pantalla de acceso ofrece **únicamente "Iniciar sessió amb Google"**. No hay
formulario de usuario y contraseña, así que el usuario `admin` del seed no sirve.

La identidad la emite un servicio externo (Zertiauth, `auth.zertifier.com`), que
devuelve una clave privada a partir de la cual se deriva la cartera del usuario. Ese
servicio no conoce la base de datos local, de modo que aunque el módulo arranque, el
inicio de sesión no llega a completarse contra un backend local.

## Cómo incluirlo

Si tienes credenciales del registro privado:

1. Crea un `.npmrc` con un token válido en el repositorio `ris3cat-smart-meter`:

   ```
   registry=https://verdaccio.zertifier.com/
   //verdaccio.zertifier.com/:_auth=<TU-TOKEN>
   ```

2. Arráncalo con su perfil:

   ```bash
   docker compose --profile smart-meter up -d
   ```

Quedará disponible en [http://localhost:4200](http://localhost:4200).

## Usar una copia local en vez de clonar

Por defecto Docker clona el repositorio al construir. Si ya lo tienes descargado al
lado del monorepo, apunta a la carpeta:

```bash
SMART_METER_CONTEXT=../ris3cat-smart-meter docker compose --profile smart-meter up -d
```

## Cada cuenta de Google crea un usuario distinto

Al entrar con Google, el sistema busca al usuario **por el correo que devuelve
Zertiauth**. Si ese correo no existe en la tabla `users`, redirige al registro y crea
un usuario nuevo con una cartera nueva.

Consecuencia práctica: registrarse con una cuenta de Google e intentar entrar
después con otra **no funciona**, y en lugar de avisar, el sistema crea un segundo
usuario. Hay que usar siempre la misma cuenta.
