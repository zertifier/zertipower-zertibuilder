---
sidebar_position: 1
title: Despliegue en un servidor nuevo
---

# Desplegar en un servidor nuevo

Guía para levantar el ecosistema completo en un servidor Ubuntu/Debian limpio.

:::info Alcance
Este procedimiento **no se ha ejecutado** durante la validación local: describe el
despliegue de referencia y debe probarse en un servidor de preproducción antes de
usarlo en producción.
:::

## Requisitos

| Requisito | Detalle |
| --- | --- |
| Sistema | Ubuntu 22.04 LTS o Debian 12 |
| CPU / RAM | Mínimo 2 vCPU y 4 GB (los builds de Angular consumen bastante) |
| Docker | Docker Engine + plugin Compose v2 |
| Node.js | Versión 20 LTS o superior |
| Puertos | `80` y `443` públicos; `3306` **sólo local** |

## 1. Preparar el sistema

```bash
sudo apt update && sudo apt install -y git curl nginx
```

Instalar Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Instalar Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
```

## 2. Base de datos

Levanta MariaDB con el mismo `docker-compose.db.yml`, pero **cambiando la contraseña
de `root`** y sin exponer el puerto al exterior. Sustituye el mapeo de puertos por:

```yaml
    ports:
      - "127.0.0.1:3306:3306"
```

Así el puerto `3306` sólo es accesible desde el propio servidor.

:::danger Nunca expongas 3306 a Internet
Es exactamente la configuración que permite un acceso remoto con `root` como el que
existe hoy en producción. Si necesitas acceso externo, hazlo por túnel SSH.
:::

## 3. Backend

```bash
cd zertipower-zertibuilder/backend && npm ci && npx prisma generate && npm run build
```

Crea el `.env` de producción (ver [Variables de entorno](../puesta-en-marcha/variables-entorno))
y arráncalo como servicio con systemd, en `/etc/systemd/system/zertipower-api.service`:

```ini
[Unit]
Description=Zertipower API
After=network.target docker.service

[Service]
Type=simple
User=zertipower
WorkingDirectory=/opt/zertipower/backend
ExecStart=/usr/bin/node dist/main
Restart=always
RestartSec=5
EnvironmentFile=/opt/zertipower/backend/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now zertipower-api
```

## 4. Frontends

Cada frontend se compila a estáticos y se sirve con Nginx:

```bash
cd zertipower-zertibuilder/frontend && npm ci && npx ng build --configuration production
```

Repite para `calculadora` y `ris3cat-smart-meter`. Copia cada `dist/` a su ruta:

```bash
sudo cp -r dist/*/browser/* /var/www/panel/
```

Antes de compilar, revisa el `environment.ts` de **producción** de cada módulo: es el
que se usa con `--configuration production`, y debe apuntar al dominio público del
API, no a `localhost`.

## 5. Nginx y dominios

Esquema de dominios sugerido:

| Dominio | Destino |
| --- | --- |
| `api.ejemplo.com` | proxy inverso a `127.0.0.1:3000` |
| `panel.ejemplo.com` | estáticos del Panel Admin |
| `calculadora.ejemplo.com` | estáticos de la Calculadora |
| `comptador.ejemplo.com` | estáticos del Contador |

Bloque para el API:

```nginx
server {
    listen 80;
    server_name api.ejemplo.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Bloque para un frontend Angular (con *fallback* de rutas al `index.html`):

```nginx
server {
    listen 80;
    server_name panel.ejemplo.com;
    root /var/www/panel;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

`try_files … /index.html` es imprescindible: sin él, recargar cualquier ruta interna
del panel devuelve 404.

## 6. Certificados SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
```

```bash
sudo certbot --nginx -d api.ejemplo.com -d panel.ejemplo.com -d calculadora.ejemplo.com -d comptador.ejemplo.com
```

Certbot instala la renovación automática. Verifícala:

```bash
sudo certbot renew --dry-run
```

## 7. Comprobaciones post-despliegue

- [ ] `https://api.ejemplo.com/api` muestra Swagger.
- [ ] El login devuelve un token.
- [ ] Los frontends cargan y hablan con el API por HTTPS (sin *mixed content*).
- [ ] `3306` **no** responde desde fuera del servidor.
- [ ] Los certificados renuevan correctamente.
- [ ] Hay copias de seguridad programadas de la base de datos.
