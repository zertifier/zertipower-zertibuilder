# ===================================================================
# Panel de Administración (Angular 17)
# ===================================================================
# IMPORTANTE — por qué este archivo vive en docker/ y no en frontend/:
#
# El pipeline de despliegue (.github/workflows/main.yml) entra en
# frontend/ y calculadora/ y ejecuta `npm i`, `npm run build` y
# `docker compose ... --build` contra la configuración que vive en el
# servidor. Añadir archivos a esas carpetas rompió esos despliegues.
#
# Manteniéndolos aquí, esas carpetas quedan intactas y el pipeline se
# comporta exactamente igual que antes.
#
# La configuración de Nginx va incrustada más abajo, en lugar de en un
# archivo aparte, porque COPY sólo puede leer del contexto de
# construcción (frontend/), y ahí no queremos dejar nada.
# ===================================================================

FROM node:20-alpine AS build

WORKDIR /src

COPY package.json package-lock.json ./
# --legacy-peer-deps: hay conflictos de peer dependencies entre paquetes
# de Angular 17 que npm rechaza por defecto.
RUN npm ci --legacy-peer-deps

COPY . .

# URL del backend. Angular la incrusta al COMPILAR, así que llega como
# build arg. Es la URL que usará el NAVEGADOR del usuario, no la red
# interna de Docker: por eso en local es localhost:3000 y no
# http://backend:3000, que el navegador no sabría resolver.
ARG API_URL=http://localhost:3000
RUN sed -i "s|api_url: *\"[^\"]*\"|api_url: \"${API_URL}\"|" src/environments/environment.development.ts \
 && grep -n "api_url" src/environments/environment.development.ts

RUN npx ng build --configuration development

FROM nginx:1.27-alpine

RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen       80;
    server_name  localhost;

    root   /usr/share/nginx/html;
    index  index.html;

    # Angular es una SPA: el enrutado lo hace el navegador. Sin este
    # try_files, recargar una ruta interna devolvería 404.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Los bundles llevan hash: se pueden cachear indefinidamente.
    location ~* \.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # index.html NO lleva hash: si se cachea, los usuarios se quedan con
    # una versión antigua de la aplicación tras cada despliegue.
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, must-revalidate";
    }

    gzip            on;
    gzip_vary       on;
    gzip_min_length 1024;
    gzip_types      text/plain text/css application/javascript application/json image/svg+xml;
}
NGINX

COPY --from=build /src/dist/frontend/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1
