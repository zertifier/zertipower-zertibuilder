---
sidebar_position: 2
title: Módulos y puertos
---

# Módulos, puertos y dependencias

## Mapa de puertos

| Puerto | Módulo | Comando |
| --- | --- | --- |
| `3306` | MariaDB (Docker) | `docker compose -f docker-compose.db.yml up -d` |
| `3000` | Backend NestJS | `npm run start:dev` |
| `4200` | Contador / Smart Meter | `ng serve --port 4200` |
| `4201` | Panel de Administración | `ng serve --port 4201` |
| `4202` | Calculadora | `ng serve --port 4202` |

El orden de arranque importa: **MariaDB → Backend → frontends**. El backend aborta
si no puede conectar con la base de datos.

## Autenticación

El backend emite JWT (`/auth/login`). El campo `role` del token determina el acceso:

- `RolePermissionGuard` (`src/features/auth/infrastructure/guards/role-permission/`)
  concede acceso inmediato si el rol es **`ADMIN`**, sin consultar `role_permission`.
- Para cualquier otro rol se consulta la tabla `role_permission`, y si no existe
  una fila que case (`resource` + `action`) se lanza `PermissionDoesNotExistError`.

Esto es la razón de que el usuario del seed mínimo funcione sin sembrar permisos:
su rol se llama exactamente `ADMIN`.

:::warning El nombre del rol es literal
`UserRole.isAdmin()` compara `name === "ADMIN"`. Si el rol se llama `admin`,
`Admin` o `ADMINISTRADOR`, el usuario **pierde todos los privilegios**.
:::

## CORS

`src/main.ts` arranca Nest con `cors: true`, es decir, CORS permisivo que refleja
cualquier origen. Los tres frontends pueden hablar con el backend sin configuración
adicional.

Las variables `FRONTEND_URL` y `COMPTADOR_FRONTEND_URL` **no controlan CORS**: se usan
para redirecciones (OAuth, recuperación de contraseña). Por eso la Calculadora
funciona en el puerto `4202` aunque no tenga ninguna variable de entorno asociada.
