---
sidebar_position: 1
title: Variables de entorno
---

# Variables de entorno del backend

El backend valida su configuración **al arrancar** contra
`src/shared/infrastructure/services/environment-service/env-schema.json`.
Las **27 variables son obligatorias**: si falta una sola, el proceso aborta.

Copia la plantilla y rellénala:

```bash
cd zertipower-zertibuilder/backend && cp .env.example .env
```

:::danger Nunca subas el `.env`
Contiene credenciales de producción, la clave secreta de Stripe y una **clave privada
de blockchain**. Verifica que `.env` está en `.gitignore`.
:::

## Base de datos

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | string | Cadena de conexión que usa **Prisma**. Formato `mysql://usuario:password@host:puerto/base`. Con el Docker local: `mysql://root:root@127.0.0.1:3306/zertipower-dev`. |
| `DB_HOST` | string | Host que usan las consultas SQL **directas** (`mysql2`), independientes de Prisma. |
| `DB_USER` | string | Usuario para esas consultas directas. |
| `DB_PASSWORD` | string | Contraseña para esas consultas directas. |
| `DB_DATABASE` | string | Nombre de la base de datos. |

:::note Dos rutas de acceso a la misma base
El backend usa Prisma **y** consultas SQL crudas con `mysql2`. Prisma lee
`DATABASE_URL`; las consultas crudas leen `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_DATABASE`.
Si ambos grupos no apuntan al mismo sitio, obtendrás errores incoherentes muy difíciles
de diagnosticar. Manténlos sincronizados.
:::

## Servidor

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `PORT` | int | Puerto de escucha de la API. Por defecto `3000`. |
| `JWT_SECRET` | string | Clave de firma de los tokens JWT. Cambiarla invalida todas las sesiones activas. |
| `APPLICATION_NAME` | string | Nombre que aparece en los logs. Normalmente `API`. |
| `VIEWS_FOLDER` | string | Carpeta de plantillas `hbs` (correo, páginas públicas). Valor esperado: `src/shared/infrastructure/views/public`. |

## URLs de los frontends

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `FRONTEND_URL` | string | URL del Panel de Administración (`http://localhost:4201`). Se usa en **redirecciones**, no en CORS. |
| `COMPTADOR_FRONTEND_URL` | string | URL del Contador / Smart Meter (`http://localhost:4200`). |

La **Calculadora no tiene variable propia** y no la necesita: CORS es permisivo
(`cors: true` en `main.ts`) y la Calculadora no recibe redirecciones del backend.

## Google OAuth

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | string | Client ID de OAuth. Es el único método de login del Contador. |
| `GOOGLE_CLIENT_SECRET` | string | Client secret correspondiente. |

## Servicios externos

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `RADIATION_API` | string | Endpoint del servicio de radiación solar (Wattabit). |
| `RADIATION_API_CREDENTIALS` | string | Credenciales en formato literal `usuario:password`. El separador `:` es obligatorio. |
| `ENERGY_PREDICTION_API` | string | Endpoint del servicio de predicción (repositorio `zp_energy_pred`). |
| `DATADIS_MONTHS` | int | Meses de histórico a descargar de Datadis en cada sincronización. |
| `TRADE_UPDATE_DAYS` | string | Ventana en días para recalcular los intercambios de energía. |

Estos servicios se consumen **contra los endpoints reales** también en local: no hay
mocks. Sin conectividad, las tareas programadas que los usan fallan, pero el arranque
del backend no se ve afectado.

## Blockchain

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `PK` | string | Clave privada (64 caracteres hexadecimales) con la que se firman las transacciones on-chain. |

:::danger Secreto crítico
`PK` es una clave privada. Quien la posea controla la wallet asociada y sus fondos.
No la escribas en tickets, capturas ni documentación.
:::

## Stripe

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `STRIPE_PRODUCT_ID` | string | Identificador del producto (`prod_…`). |
| `STRIPE_PRICE_KEY` | string | Identificador del precio (`price_…`). |
| `STRIPE_SECRET_KEY` | string | Clave secreta de la API. En local debe ser siempre una clave **de test** (`sk_test_…`). |

## SMTP

| Variable | Tipo | Descripción |
| --- | --- | --- |
| `SMTP_USER` | string | Usuario del servidor de correo. |
| `SMTP_DISPLAY_EMAIL` | string | Dirección que aparece como remitente. |
| `SMTP_PASSWORD` | string | Contraseña SMTP. |
| `SMTP_SERVER` | string | Host del servidor SMTP. |
| `SMTP_PORT` | int | Puerto, habitualmente `465` (SSL). |

En local pueden dejarse valores ficticios: el backend arranca igualmente y sólo
fallará el envío real de correo (recuperación de contraseña, notificaciones).

## Frontends: no usan `.env`

Los tres frontends Angular se configuran mediante archivos TypeScript en
`src/environments/`:

| Módulo | Archivo | Clave a apuntar al backend |
| --- | --- | --- |
| Panel Admin | `frontend/src/environments/environment.development.ts` | `api_url: "http://localhost:3000"` |
| Calculadora | `calculadora/src/environments/environment.development.ts` | `api_url: "http://localhost:3000"` |
| Contador | `ris3cat-smart-meter/src/environments/environment.development.ts` | `zertipower_url: "http://localhost:3000"` |

`ng serve` usa la configuración `development`, que sustituye `environment.ts` por
`environment.development.ts` mediante `fileReplacements` en `angular.json`.
