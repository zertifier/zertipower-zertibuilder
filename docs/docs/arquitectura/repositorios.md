---
sidebar_position: 1
title: Repositorios
---

# Repositorios de GitHub

El sistema vive en **dos repositorios** (más uno opcional):

| Componente | Repositorio | Subcarpeta | Estado |
| --- | --- | --- | --- |
| Monorepo principal | `zertifier/zertipower-zertibuilder` | raíz | Público |
| ↳ Backend (API) | `zertifier/zertipower-zertibuilder` | `/backend` | Público |
| ↳ Panel Admin | `zertifier/zertipower-zertibuilder` | `/frontend` | Público |
| ↳ Calculadora | `zertifier/zertipower-zertibuilder` | `/calculadora` | Público |
| Contador / Smart Meter | `zertifier/ris3cat-smart-meter` | raíz | Público |
| Predicción (opcional) | `zertifier/zp_energy_pred` | raíz | **Privado / no accesible** |

## Clonado

```bash
git clone https://github.com/zertifier/zertipower-zertibuilder.git
```

```bash
git clone https://github.com/zertifier/ris3cat-smart-meter.git
```

Ambos repositorios se clonan en el **mismo directorio padre**. La estructura
resultante es la que asume el resto de esta documentación:

```
Ris3Cat/
├── docker-compose.db.yml
├── sql/
│   └── seed_minimo.sql
├── docs/                      ← esta documentación
├── zertipower-zertibuilder/
│   ├── backend/
│   ├── frontend/
│   └── calculadora/
└── ris3cat-smart-meter/
```

:::note Servicio de predicción
`zp_energy_pred` devuelve HTTP 404 sin autenticación: es privado o no existe.
No es necesario para levantar el entorno local. El backend lo consume por HTTP a
través de la variable `ENERGY_PREDICTION_API`, que apunta al servicio ya desplegado.
:::

## Otras carpetas del monorepo

El monorepo contiene además carpetas que **no forman parte** de los 4 módulos
principales y que no hace falta arrancar en local:

- `frontend_legacy/` — versión antigua del panel, sustituida por `frontend/`.
- `realtime-energy-api/` — API independiente de energía en tiempo real.
- `zertipower-hugo/` — sitio web estático de marketing.
