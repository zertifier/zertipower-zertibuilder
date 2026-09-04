#!/usr/bin/env bash
# ===================================================================
# Zertipower / Ris3CAT — instalador para Linux y macOS
# ===================================================================
# Uso:
#     ./setup.sh
#
# Lo único que hace falta tener instalado es Docker.
# ===================================================================

set -euo pipefail

VERDE='\033[0;32m'; ROJO='\033[0;31m'; AMAR='\033[1;33m'; NC='\033[0m'
ok()   { echo -e "  ${VERDE}✔${NC} $1"; }
err()  { echo -e "  ${ROJO}✘${NC} $1"; }
warn() { echo -e "  ${AMAR}!${NC} $1"; }

echo
echo "==================================================="
echo "  Zertipower / Ris3CAT — instalación"
echo "==================================================="
echo

# --- 1. Comprobar Docker --------------------------------------------
echo "Comprobando requisitos..."

if ! command -v docker >/dev/null 2>&1; then
  err "Docker no está instalado."
  echo
  echo "  Instálalo desde https://docs.docker.com/get-docker/ y vuelve"
  echo "  a ejecutar este script. Es lo único que necesitas."
  exit 1
fi
ok "Docker instalado"

if ! docker info >/dev/null 2>&1; then
  err "Docker está instalado pero no se está ejecutando."
  echo "  Arranca Docker Desktop (o 'sudo systemctl start docker') e inténtalo de nuevo."
  exit 1
fi
ok "Docker en marcha"

if ! docker compose version >/dev/null 2>&1; then
  err "Falta el plugin 'docker compose'."
  echo "  Actualiza Docker a una versión reciente."
  exit 1
fi
ok "docker compose disponible"

# --- 2. Configuración -------------------------------------------------
echo
echo "Configuración"
echo "-------------"
echo "Pulsa INTRO para aceptar el valor entre corchetes."
echo

preguntar() {          # preguntar <variable> <texto> <valor por defecto>
  local __var=$1 texto=$2 defecto=$3 respuesta
  read -r -p "  ${texto} [${defecto}]: " respuesta
  printf -v "$__var" '%s' "${respuesta:-$defecto}"
}

preguntar BACKEND_PORT     "Puerto de la API"                  "3000"
preguntar FRONTEND_PORT    "Puerto del Panel de Administración" "4201"
preguntar CALCULADORA_PORT "Puerto de la Calculadora"          "4202"
preguntar SMART_METER_PORT "Puerto del Contador"               "4200"
preguntar DB_PORT          "Puerto de la base de datos"        "3306"

echo
read -r -p "  ¿Vas a exponer esto en un dominio público? (s/N): " es_publico
PUBLIC_API_URL="http://localhost:${BACKEND_PORT}"
if [[ "${es_publico,,}" == "s" ]]; then
  preguntar PUBLIC_API_URL "URL pública de la API" "https://api.ejemplo.com"
  warn "Recuerda cambiar JWT_SECRET y las credenciales por defecto antes de usarlo en producción."
fi

# --- 3. Escribir .env -------------------------------------------------
if [[ -f docker/.env ]]; then
  cp docker/.env "docker/.env.backup.$(date +%Y%m%d%H%M%S)"
  warn "Ya existía un .env; se ha guardado una copia de seguridad."
fi

cat > docker/.env <<EOF
# Generado por setup.sh el $(date '+%Y-%m-%d %H:%M')
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
CALCULADORA_PORT=${CALCULADORA_PORT}
SMART_METER_PORT=${SMART_METER_PORT}
DB_PORT=${DB_PORT}

PUBLIC_API_URL=${PUBLIC_API_URL}
FRONTEND_URL=http://localhost:${FRONTEND_PORT}
COMPTADOR_URL=http://localhost:${SMART_METER_PORT}

DB_PASSWORD=root
DB_DATABASE=zertipower-dev
JWT_SECRET=clave-de-desarrollo-cambiar-en-produccion
EOF
ok "Archivo docker/.env generado"

# --- 4. Arrancar ------------------------------------------------------
echo
echo "Construyendo y arrancando (la primera vez tarda varios minutos)..."
echo

docker compose -f docker/docker-compose.yml up -d --build

# --- 5. Resumen -------------------------------------------------------
echo
echo "==================================================="
ok "Sistema en marcha"
echo "==================================================="
echo
echo "  Panel de Administración   http://localhost:${FRONTEND_PORT}"
echo "  Calculadora               http://localhost:${CALCULADORA_PORT}"
echo "  Contador / Smart Meter    http://localhost:${SMART_METER_PORT}"
echo "  API (Swagger)             http://localhost:${BACKEND_PORT}/api"
echo
echo "  Usuario de prueba:  admin  /  admin123"
echo
echo "  Ver el estado:     cd docker && docker compose ps"
echo "  Ver los registros: cd docker && docker compose logs -f"
echo "  Parar:             cd docker && docker compose down"
echo
