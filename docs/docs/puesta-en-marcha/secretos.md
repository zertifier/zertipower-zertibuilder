---
sidebar_position: 3
title: Gestión de secretos
---

# Gestión de secretos

La configuración del backend incluye credenciales de alto impacto. Esta página
describe cómo tratarlas.

## Qué hay en el `.env`

| Secreto | Impacto si se filtra |
| --- | --- |
| Contraseña `root` de la BD de producción | Acceso total a ~20 bases de datos de Zertifier, no sólo Zertipower. |
| `PK` (clave privada blockchain) | Control de la wallet asociada y de sus fondos. |
| `STRIPE_SECRET_KEY` | Operaciones en la cuenta de Stripe. En local debe ser `sk_test_…`. |
| `GOOGLE_CLIENT_SECRET` | Suplantación del flujo OAuth. |
| `JWT_SECRET` | Falsificación de tokens de sesión de cualquier usuario. |
| `RADIATION_API_CREDENTIALS` | Acceso al API de radiación de terceros. |

## Reglas

1. **El `.env` nunca se versiona.** Debe estar en `.gitignore`. Lo que se versiona es
   `.env.example`, sólo con marcadores de posición.
2. **Los secretos no van en la documentación.** Esta documentación es un artefacto
   compartible: describe *el procedimiento*, no los valores.
3. **Nada de credenciales en la línea de comandos.** Quedan en el historial del shell
   y en la lista de procesos. Usa un archivo de opciones (ver
   [Volcado remoto](../base-de-datos/volcado-remoto)).
4. **En local, claves de test.** Stripe en modo test; nunca claves `sk_live_`.
5. **Copias mínimas.** Cada copia adicional de un secreto es una superficie de fuga
   más. Borra los volcados y archivos temporales cuando dejen de hacer falta.

## Comprobar que no se ha filtrado nada

Antes de hacer commit, comprueba que ningún secreto real ha entrado en archivos
versionados:

```bash
git grep -nE "sk_live_|BEGIN PRIVATE KEY|password=" -- . ':!*.example'
```

Y confirma que Git ignora efectivamente el `.env`:

```bash
git check-ignore -v zertipower-zertibuilder/backend/.env
```

Si el comando no devuelve nada, **el archivo no está ignorado**: corrígelo antes de
seguir.

## Rotación

Si un secreto se expone (se pega en un chat, se sube por error, se comparte en una
captura), la única respuesta correcta es **rotarlo**, no borrar el mensaje. En
particular la clave `PK` y la contraseña de producción.
