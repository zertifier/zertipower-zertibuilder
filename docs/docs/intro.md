---
sidebar_position: 1
title: Introducción
slug: /
---

# Zertipower / Ris3CAT — Documentación técnica

Esta documentación describe cómo levantar **todo el ecosistema Zertipower en local**,
sin depender del servidor remoto de producción, y cómo desplegarlo en un servidor nuevo.

## ¿Qué compone el sistema?

El ecosistema está formado por **4 módulos** que se ejecutan simultáneamente:

| Módulo | Puerto local | Tecnología |
| --- | --- | --- |
| Backend / API | `3000` | NestJS 10 + Prisma 5 + MariaDB |
| Panel de Administración | `4201` | Angular 17 |
| Calculadora | `4202` | Angular 17 |
| Contador / Smart Meter | `4200` | Angular 17 |

Todos los frontends consumen el **mismo backend** en `http://localhost:3000`.

## Ruta rápida

Si sólo quieres el entorno funcionando, sigue estos cuatro pasos en orden:

1. [Base de datos local](./base-de-datos/mariadb-local) — MariaDB en Docker.
2. [Seed mínimo](./base-de-datos/seed-minimo) — datos imprescindibles.
3. [Variables de entorno](./puesta-en-marcha/variables-entorno) — el archivo `.env`.
4. [Arrancar los módulos](./puesta-en-marcha/arrancar-modulos).

:::tip Credenciales de desarrollo
Tras aplicar el seed mínimo puedes entrar en el Panel de Administración con
**usuario `admin`** y **contraseña `admin123`**.
:::

:::danger Secretos
El archivo `.env` real contiene credenciales de producción, claves de Stripe y una
**clave privada de blockchain**. Nunca lo subas al repositorio. Consulta
[Gestión de secretos](./puesta-en-marcha/secretos).
:::
