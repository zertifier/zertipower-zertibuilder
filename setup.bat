@echo off
REM ===================================================================
REM  Zertipower / Ris3CAT - instalador para Windows
REM ===================================================================
REM  Uso: haz doble clic en este archivo, o ejecuta  setup.bat
REM  Lo unico que hace falta tener instalado es Docker Desktop.
REM ===================================================================

setlocal enabledelayedexpansion

echo.
echo ===================================================
echo   Zertipower / Ris3CAT - instalacion
echo ===================================================
echo.

REM --- 1. Comprobar Docker --------------------------------------------
echo Comprobando requisitos...

where docker >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Docker no esta instalado.
  echo.
  echo   Instala Docker Desktop desde https://docs.docker.com/get-docker/
  echo   y vuelve a ejecutar este archivo. Es lo unico que necesitas.
  echo.
  pause
  exit /b 1
)
echo   [OK] Docker instalado

docker info >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Docker esta instalado pero no se esta ejecutando.
  echo   Abre Docker Desktop, espera a que arranque, e intentalo de nuevo.
  echo.
  pause
  exit /b 1
)
echo   [OK] Docker en marcha

docker compose version >nul 2>&1
if errorlevel 1 (
  echo   [ERROR] Falta el plugin "docker compose".
  echo   Actualiza Docker Desktop a una version reciente.
  echo.
  pause
  exit /b 1
)
echo   [OK] docker compose disponible

REM --- 2. Configuracion -------------------------------------------------
echo.
echo Configuracion
echo -------------
echo Pulsa INTRO para aceptar el valor entre corchetes.
echo.

set "BACKEND_PORT=3000"
set /p "BACKEND_PORT=  Puerto de la API [3000]: "

set "FRONTEND_PORT=4201"
set /p "FRONTEND_PORT=  Puerto del Panel de Administracion [4201]: "

set "CALCULADORA_PORT=4202"
set /p "CALCULADORA_PORT=  Puerto de la Calculadora [4202]: "

set "SMART_METER_PORT=4200"
set /p "SMART_METER_PORT=  Puerto del Contador [4200]: "

set "DB_PORT=3306"
set /p "DB_PORT=  Puerto de la base de datos [3306]: "

set "PUBLIC_API_URL=http://localhost:%BACKEND_PORT%"
set "ES_PUBLICO=n"
set /p "ES_PUBLICO=  Vas a exponer esto en un dominio publico? (s/N): "
if /i "%ES_PUBLICO%"=="s" (
  set "PUBLIC_API_URL=https://api.ejemplo.com"
  set /p "PUBLIC_API_URL=  URL publica de la API [https://api.ejemplo.com]: "
  echo   [AVISO] Cambia JWT_SECRET y las credenciales por defecto antes de usarlo en produccion.
)

REM --- 3. Escribir .env -------------------------------------------------
if exist docker\.env (
  copy /y docker\.env docker\.env.backup >nul
  echo   [AVISO] Ya existia un .env; se ha guardado como .env.backup
)

(
  echo # Generado por setup.bat
  echo BACKEND_PORT=%BACKEND_PORT%
  echo FRONTEND_PORT=%FRONTEND_PORT%
  echo CALCULADORA_PORT=%CALCULADORA_PORT%
  echo SMART_METER_PORT=%SMART_METER_PORT%
  echo DB_PORT=%DB_PORT%
  echo.
  echo PUBLIC_API_URL=%PUBLIC_API_URL%
  echo FRONTEND_URL=http://localhost:%FRONTEND_PORT%
  echo COMPTADOR_URL=http://localhost:%SMART_METER_PORT%
  echo.
  echo DB_PASSWORD=root
  echo DB_DATABASE=zertipower-dev
  echo JWT_SECRET=clave-de-desarrollo-cambiar-en-produccion
) > docker\.env
echo   [OK] Archivo docker\.env generado

REM --- 4. Arrancar ------------------------------------------------------
echo.
echo Construyendo y arrancando (la primera vez tarda varios minutos)...
echo.

docker compose -f docker/docker-compose.yml up -d --build
if errorlevel 1 (
  echo.
  echo   [ERROR] Algo ha fallado al arrancar. Revisa el mensaje de arriba.
  echo   Para ver mas detalle:  cd docker ^&^& docker compose logs
  echo.
  pause
  exit /b 1
)

REM --- 5. Resumen -------------------------------------------------------
echo.
echo ===================================================
echo   [OK] Sistema en marcha
echo ===================================================
echo.
echo   Panel de Administracion   http://localhost:%FRONTEND_PORT%
echo   Calculadora               http://localhost:%CALCULADORA_PORT%
echo   Contador / Smart Meter    http://localhost:%SMART_METER_PORT%
echo   API (Swagger)             http://localhost:%BACKEND_PORT%/api
echo.
echo   Usuario de prueba:  admin  /  admin123
echo.
echo   Ver el estado:     cd docker ^&^& docker compose ps
echo   Ver los registros: cd docker ^&^& docker compose logs -f
echo   Parar:             cd docker ^&^& docker compose down
echo.
pause
