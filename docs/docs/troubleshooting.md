---
sidebar_position: 6
title: Solución de problemas
---

# Solución de problemas

Incidencias reales encontradas durante la validación del entorno local, con su causa
y su solución.

## El backend arranca y se cae: `Unknown column 'users.customer_id'`

```
Error: Unknown column 'users.customer_id' in 'ON'
    at CustomersDbRequestsService.watchBalances
```

**Causa.** Se ha construido la base de datos a partir de
`backend/backups/database.sql`. Ese volcado versionado está obsoleto: le faltan **15
tablas** que el código actual necesita (`energy_hourly`, `energy_realtime`, `trades`,
`notifications`, `notifications_categories`, `proposals`, `proposals_options`,
`responses`, `votes`, `shares`, `stripe`, `non_working_days`,
`users_notifications`, `users_notifications_categories`,
`users_notifications_historic`) y la columna `users.customer_id`.

El fallo ocurre en el constructor de un servicio, durante la inyección de
dependencias, de modo que **tumba el proceso entero**: no es un error recuperable.

**Solución.** No uses ese archivo. Reconstruye el esquema desde Prisma:

```bash
cd zertipower-zertibuilder/backend && npx prisma db push
```

O aplica directamente [`sql/seed_minimo.sql`](./base-de-datos/seed-minimo), que ya
incorpora el esquema correcto.

## La Calculadora muestra "Error de connexió amb el servidor"

El asistente carga pero aparece un diálogo de error, y la consola registra
`net::ERR_CERT_COMMON_NAME_INVALID`.

**Causa.** Errata en `calculadora/angular.json`: el bloque `fileReplacements` de la
configuración `development` declaraba

```json
"replace": "src/environments/enviroment.ts"
```

con **`enviroment`** en lugar de `environment`. Como esa ruta no existe, la
sustitución no se aplica nunca y `ng serve` compila con `environment.ts`, que es el de
**producción** y apunta a `https://api-dev-ris3cat.zertifier.com`. El navegador
rechaza el certificado de ese host y la petición falla.

Angular **no avisa** de que la ruta de `fileReplacements` no existe, lo que hace el
fallo especialmente difícil de localizar.

**Solución.** Corregir la errata:

```json
"replace": "src/environments/environment.ts"
```

y reiniciar `ng serve` (los cambios en `angular.json` no se recargan en caliente).
El Panel Admin y el Contador no están afectados: su `angular.json` es correcto.

## `Port 4202 is already in use` al reiniciar

Al detener un `ng serve` puede quedar el proceso hijo de Node ocupando el puerto,
aunque el terminal ya haya vuelto.

**Solución en Windows (PowerShell).** Localizar y terminar el proceso:

```powershell
Get-NetTCPConnection -LocalPort 4202 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }
```

En Linux o macOS:

```bash
lsof -ti :4202 | xargs kill -9
```

## `Could not open required defaults file: /C:/Program Files/Git/cfg/...`

Aparece al montar un archivo de configuración en un contenedor desde **Git Bash** en
Windows.

**Causa.** Git Bash convierte automáticamente las rutas que empiezan por `/` a rutas
de Windows, de modo que `/cfg/remote.cnf` se transforma antes de llegar al contenedor.

**Solución.** Desactivar la conversión anteponiendo la variable:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd)/.secrets:/cfg:ro" mariadb:10.11 mariadb --defaults-extra-file=/cfg/remote.cnf -e "SELECT 1"
```

## Errores normales al arrancar el backend

Estos dos aparecen siempre en local y **no indican un problema**:

**`Error inicialitzant servei blockchain — Cannot read properties of undefined (reading 'contract_address')`**
La tabla `smart_contracts` está vacía en el seed mínimo, así que el servicio de
blockchain no encuentra contrato que cargar. El error está capturado y el resto de la
API funciona. Sólo afectaría a las funciones on-chain.

**Error 500 en `/nikola-auth/tokens/login`**
Una tarea programada intenta autenticarse contra un servicio externo (Nikola) que no
es accesible desde el entorno local. No afecta al arranque.

## Caracteres acentuados que se corrompen

El esquema **antiguo** de producción usa el juego de caracteres `armscii8`
(ASCII armenio) en varias tablas: `communities`, `cups`, `locations`, `providers` y
`customers`. Ese juego **no admite acentos ni `ñ`**, de modo que `Comunitat
Energètica` se guarda corrupto.

El esquema regenerado con `prisma db push` usa `utf8mb4` en todas las tablas y no
tiene este problema. Si trabajas sobre un volcado de producción, tenlo en cuenta al
insertar datos con acentos.

## El Contador no acepta el usuario del seed

Es el comportamiento esperado: la pantalla de acceso del Contador ofrece
**únicamente Google OAuth**. No existe formulario de usuario y contraseña, así que el
usuario `admin` del seed no puede entrar. Para validar las métricas se necesita una
cuenta de Google válida contra el `GOOGLE_CLIENT_ID` configurado.

## Angular 17 y versiones recientes de Node

Angular 17 declara soporte oficial para Node 18 y 20. En la validación, los tres
frontends compilaron y sirvieron **sin problemas con Node 26**.

Si en tu máquina apareciera un error de versión no soportada, instala Node 20 con
`nvm`:

```bash
nvm install 20 && nvm use 20
```
