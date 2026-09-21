# Módulo de Previsión de Producción Solar

Este módulo implementa un sistema completo de predicción de producción solar que integra datos históricos, predicción meteorológica y la API de predicción del usuario para la comunidad Montolivet.

## 🌟 Características

- **Extracción de datos históricos**: Obtención de datos de producción de la tabla `energy_hourly`
- **Integración con Open Meteo**: API meteorológica gratuita para obtener predicciones de radiación
- **Configuración solar por instalación**: Soporte para configuraciones específicas por CUPS
- **Predicción individual y comunitaria**: Predicciones para casas individuales y predicción conjunta
- **Especialización para Montolivet**: Endpoints específicos para la comunidad Montolivet

## 📋 Requisitos Previos

- Node.js y npm/pnpm instalados
- Base de datos MariaDB configurada
- Acceso a la API de predicción del usuario (`https://prediction.zertipower.com`)

## 🔧 Configuración

### Jerarquía de Configuración Solar

El sistema utiliza una **jerarquía de prioridad** para obtener la configuración solar de cada instalación:

1. **Calculadora (Prioridad más alta)**: Intenta obtener la configuración directamente desde la calculadora
2. **Archivo .env (Prioridad media)**: Si la calculadora no está disponible, usa `SOLAR_INSTALLATIONS_JSON`
3. **Valores por defecto (Prioridad más baja)**: Si todo falla, usa valores estándar

### 1. Variables de Entorno

Añade las siguientes variables a tu archivo `.env`:

```bash
# API Meteorológica (Open Meteo)
OPEN_METEO_API_URL="https://api.open-meteo.com/v1/forecast"
OPEN_METEO_API_KEY=""  # Solo necesario para uso comercial

# Configuración Solar por CUPS
SOLAR_INSTALLATIONS_JSON='{"1": {"latitud": 42.18, "longitud": 2.48, "kwp": 7.22, "potencia_inversor_kw": 6, "graus": 30, "performance_ratio": 0.8, "orientacio": "sud-oest", "azimut": 225}}'

# API de Predicción Solar (alternativa)
SOLAR_API_URL="https://ai.megatro.cat:9999/previsio"
SOLAR_API_AUTH_CODE="<auth-code>"
SOLAR_API_ALLOW_INSECURE_TLS="false"

# Configuración Comunidad Montolivet
MONTOLIVET_COMMUNITY_ID="1"
```

### 2. Integración con la Calculadora

El sistema puede obtener automáticamente la configuración solar desde la calculadora en https://calculadora.zertipower.com/calculate. Los parámetros que se extraen son:

- **latitud, longitud**: Coordenadas de la instalación
- **m2**: Área disponible para paneles solares
- **orientation**: Orientación (0=sud, 90=est/oest)
- **inclination**: Inclinación en grados (2, 13, 25, 35)
- **n_plaques**: Número de placas solares
- **kwp**: Potencia pico calculada automáticamente

### 3. Configuración Manual por CUPS (Fallback)

Si la integración con la calculadora no está disponible, el parámetro `SOLAR_INSTALLATIONS_JSON` permite configurar especificaciones técnicas manualmente:

```json
{
  "<cups_id>": {
    "latitud": 42.18,
    "longitud": 2.48,
    "kwp": 7.22,
    "potencia_inversor_kw": 6,
    "graus": 30,
    "performance_ratio": 0.8,
    "orientacio": "sud-oest",
    "azimut": 225
  }
}
```

**Parámetros de configuración manual:**
- `latitud, longitud`: Coordenadas de la instalación
- `kwp`: Potencia pico en kW
- `potencia_inversor_kw`: Potencia del inversor
- `graus`: Inclinación (2, 13, 25, 35 grados)
- `performance_ratio`: Ratio de rendimiento (0.8 por defecto)
- `orientacio`: Orientación (sud, est, oest, sud-oest, etc.)
- `azimut`: Azimut en grados (-180 a 180)

## 🚀 Instalación

### 1. Instalar dependencias

```bash
cd backend
pnpm install
```

### 2. Configurar base de datos

```bash
# Ejecutar migraciones de Prisma
npx prisma migrate dev

# Generar cliente Prisma
npx prisma generate
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores reales
nano .env
```

### 4. Iniciar el servidor

```bash
# Desarrollo
pnpm run start:dev

# Producción
pnpm run start:prod
```

## 📡 Endpoints API

### Predicción Meteorológica

#### Obtener predicción actual
```
GET /weather-prediction?lat=42.18&lon=2.48
```

#### Obtener datos históricos
```
GET /weather-prediction/historical?lat=42.18&lon=2.48&start_date=2024-01-01&end_date=2024-01-31
```

### Datos Históricos de Producción

#### Obtener datos de producción por CUPS
```
GET /historical-data/cups/:cupsId/production?start_date=2024-01-01&end_date=2024-01-31
```

#### Obtener datos de producción con meteorología
```
GET /historical-data/cups/:cupsId/production-with-weather?start_date=2024-01-01&end_date=2024-01-31&lat=42.18&lng=2.48
```

#### Obtener datos históricos de comunidad
```
GET /historical-data/community/:communityId/historical?start_date=2024-01-01&end_date=2024-01-31
```

#### Obtener configuración solar de CUPS
```
GET /historical-data/cups/:cupsId/config
```

### Sincronización con Calculadora

#### Obtener configuración de CUPS desde calculadora
```
GET /calculadora-sync/cups/:cupsId/config
```

#### Sincronizar todos los CUPS con calculadora
```
POST /calculadora-sync/sync/all
POST /calculadora-sync/sync/all?communityId=X
```

#### Sincronizar CUPS de una comunidad
```
POST /calculadora-sync/sync/community/:communityId
```

### Predicción con API del Usuario

#### Predicción de producción para CUPS
```
POST /user-prediction/cups/:cupsId/production
Body: { "start_date": "2024-01-01", "end_date": "2024-01-07" }
```

#### Predicción de producción para comunidad
```
POST /user-prediction/community/:communityId/production
Body: { "start_date": "2024-01-01", "end_date": "2024-01-07" }
```

#### Predicción conjunta de comunidad
```
POST /user-prediction/community/:communityId/combined
Body: { "start_date": "2024-01-01", "end_date": "2024-01-07" }
```

### Predicción Específica Montolivet

#### Obtener predicción de Montolivet
```
GET /montolivet/prediction?start_date=2024-01-01&end_date=2024-01-07
```

#### Obtener instalaciones de Montolivet
```
GET /montolivet/installations
```

#### Obtener datos históricos de Montolivet
```
GET /montolivet/historical?start_date=2024-01-01&end_date=2024-01-31
```

## 🌤️ Open Meteo API

**Límites de la versión gratuita:**
- 10,000 llamadas/día
- 5,000 llamadas/hora  
- 600 llamadas/minuto
- Requiere atribución CC BY 4.0

**Para uso comercial:**
- Planes desde 1M llamadas/mes
- Servidores dedicados
- Sin límites de rate limiting
- Más información: https://open-meteo.com/en/pricing

## 📊 Flujo de Predicción

1. **Extracción de Configuración (Jerarquía)**:
   - **Primero**: Intenta obtener configuración desde la calculadora
   - **Segundo**: Si falla, usa `SOLAR_INSTALLATIONS_JSON` del .env
   - **Tercero**: Si todo falla, usa valores por defecto
2. **Datos Históricos**: Extrae datos de producción de `energy_hourly` de los últimos 30 días
3. **Predicción Meteorológica**: Obtiene predicción de Open Meteo para la ubicación
4. **Integración API**: Envía todos los datos a la API de predicción del usuario
5. **Predicción Conjunta**: Agrega predicciones individuales para obtener predicción comunitaria

### Flujo Detallado de Obtención de Configuración

```
Solicitud de Predicción
         ↓
┌────────────────────────┐
│ ¿Calculadora disponible?│
└────────────────────────┘
         ↓ SÍ
┌────────────────────────┐
│ Obtener config de API  │
│ de energy-areas        │
│ (m2, orientation, etc) │
└────────────────────────┘
         ↓ ÉXITO
┌────────────────────────┐
│ Usar config calculadora│
│ (Prioridad #1)         │
└────────────────────────┘
         ↓ FALLA
┌────────────────────────┐
│ Usar SOLAR_INSTALLATIONS_│
│ JSON del .env           │
│ (Prioridad #2)         │
└────────────────────────┘
         ↓ FALLA
┌────────────────────────┐
│ Usar valores por defecto│
│ (Prioridad #3)         │
└────────────────────────┘
```

## 🔍 Troubleshooting

### Error: "Configuration not found for CUPS X"
- Verifica que el CUPS existe en la base de datos
- Añade la configuración en `SOLAR_INSTALLATIONS_JSON`

### Error: "Community Montolivet not found"
- Verifica que `MONTOLIVET_COMMUNITY_ID` es correcto en `.env`
- Confirma que la comunidad existe en la base de datos

### Error: "Solar forecast API request failed"
- Verifica las credenciales de `SOLAR_API_AUTH_CODE`
- Confirma que `SOLAR_API_URL` es accesible

### Error: "Failed to get historical data"
- Verifica que hay datos en la tabla `energy_hourly`
- Confirma que las fechas son correctas

## 📝 Notas

- El módulo utiliza la zona horaria 'Europe/Madrid' por defecto
- Las predicciones por defecto son para 7 días
- Los datos históricos se extraen de los últimos 30 días por defecto
- La API de predicción del usuario debe soportar el formato de envío definido

## 🤝 Soporte

Para problemas o preguntas, contacta con el equipo de desarrollo o revisa la documentación oficial de:
- Open Meteo: https://open-meteo.com/en/docs
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs