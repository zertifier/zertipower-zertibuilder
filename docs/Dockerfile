# ===================================================================
# Documentación técnica Zertipower / Ris3CAT (Docusaurus)
# ===================================================================
# Build en dos etapas: se compila el sitio estático con Node y se sirve
# con Nginx. La imagen final no lleva Node ni node_modules.
#
# NOTA sobre versiones: todas las imágenes y herramientas van FIJADAS a
# propósito. El Dockerfile del backend usaba `npm i -g pnpm` sin versión
# y `pnpx prisma`, que descargan siempre la última versión publicada;
# cuando pnpm y prisma sacaron una major nueva, el despliegue se rompió
# sin que cambiara una sola línea del proyecto. No repetir ese patrón.
# ===================================================================

### Etapa 1 — compilar el sitio estático
FROM node:20-alpine AS build

WORKDIR /src

# Se copian primero los manifiestos para aprovechar la caché de capas:
# mientras no cambien las dependencias, no se reinstala nada.
COPY package.json package-lock.json ./

# `npm ci` instala exactamente lo que dice package-lock.json.
# Es reproducible, a diferencia de `npm install`.
RUN npm ci

COPY . .

# Docusaurus fija la URL del sitio al COMPILAR, no al arrancar. Por eso
# llega como build arg y no como variable de entorno del contenedor:
# ponerla en `environment:` no tendría ningún efecto.
ARG DOCS_URL
ARG DOCS_BASE_URL
ENV DOCS_URL=${DOCS_URL}
ENV DOCS_BASE_URL=${DOCS_BASE_URL}

RUN npm run build

### Etapa 2 — servir los estáticos
FROM nginx:1.27-alpine

COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/build /usr/share/nginx/html

EXPOSE 80

# Comprobación de salud: si Nginx deja de servir, el contenedor se marca
# como unhealthy en lugar de aparentar estar bien.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1
