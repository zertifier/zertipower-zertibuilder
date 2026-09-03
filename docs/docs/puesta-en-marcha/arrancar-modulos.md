---
sidebar_position: 2
title: Arrancar los módulos
---

# Arrancar los cuatro módulos

Requisitos: **Node.js**, **Docker** y **Git**. Verificado con Node 26 y Docker 29.

Cada módulo ocupa una terminal distinta (los tres `ng serve` y el backend quedan en
primer plano).

## 0. Base de datos

```bash
docker compose -f docker-compose.db.yml up -d
```

```bash
docker exec -i mariadb-zertipower-local mariadb -u root -proot < sql/seed_minimo.sql
```

## 1. Backend — puerto 3000

```bash
cd zertipower-zertibuilder/backend && npm install
```

```bash
npx prisma generate
```

```bash
npm run start:dev
```

Arranque correcto cuando el log muestra las rutas mapeadas y `Sync permissions`.
Comprobación rápida (Swagger):

```bash
curl -o /dev/null -w "%{http_code}\n" http://localhost:3000/api
```

Debe responder `200`. Y el login del seed:

```bash
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{\"user\":\"admin\",\"password\":\"admin123\"}"
```

Debe devolver `access_token` y `refresh_token`.

## 2. Panel de Administración — puerto 4201

```bash
cd zertipower-zertibuilder/frontend && npm install
```

```bash
npx ng serve --port 4201
```

Entra en `http://localhost:4201` con **admin / admin123**. Deberías ver el menú
lateral y, en *Participants → Communitats*, la comunidad del seed con **2
participants**; en *Participants → Cups*, los dos CUPS.

## 3. Calculadora — puerto 4202

```bash
cd zertipower-zertibuilder/calculadora && npm install
```

```bash
npx ng serve --port 4202
```

En `http://localhost:4202`, el botón *Calcular energia* abre el asistente de 6 pasos.
El desplegable del primer paso debe listar la localidad del seed (**Barcelona**).

## 4. Contador / Smart Meter — puerto 4200

```bash
cd ris3cat-smart-meter && npm install
```

```bash
npx ng serve --port 4200
```

En `http://localhost:4200` carga la pantalla de acceso.

:::warning El Contador sólo permite acceso con Google
La pantalla de login del Contador ofrece **únicamente "Iniciar sessió amb google"**.
No admite usuario y contraseña, de modo que el usuario del seed mínimo **no sirve**
para entrar. Para ver las métricas hace falta una cuenta de Google válida contra el
`GOOGLE_CLIENT_ID` configurado.
:::

## Instalación de dependencias

Los tres frontends se instalan con normalidad. Si `npm install` falla por conflictos
de dependencias entre paquetes de Angular 17, usa:

```bash
npm install --legacy-peer-deps
```

## Comprobación final

Con todo levantado, los cuatro puertos deben responder `200`:

```bash
for p in 3000 4200 4201 4202; do curl -s -o /dev/null -w "$p -> %{http_code}\n" http://localhost:$p/; done
```
