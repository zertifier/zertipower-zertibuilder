---
sidebar_position: 1
title: Desplegar en un servidor
---

# Desplegar en un servidor

Es el mismo procedimiento que en local, más un proxy que se encarga de los dominios
y los certificados HTTPS.

## 1. Requisitos

| Requisito | Detalle |
| --- | --- |
| Sistema | Ubuntu 22.04 LTS, Debian 12 o similar |
| CPU / RAM | Mínimo 2 vCPU y 4 GB (compilar los frontends consume bastante) |
| Docker | Docker Engine con el plugin `compose` |
| Puertos | `80` y `443` abiertos. **`3306` NO debe estar abierto a Internet** |
| DNS | Un registro `A` por cada dominio, apuntando a la IP del servidor |

Instalar Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

## 2. Levantar el proxy (una sola vez por servidor)

`nginx-proxy` y `acme-companion` se encargan de todo: detectan los contenedores que
arrancan, generan la configuración de Nginx y piden los certificados de Let's
Encrypt automáticamente. **No hay que editar ningún archivo de Nginx ni ejecutar
certbot a mano.**

Este proxy da servicio a todas las aplicaciones del servidor, así que se levanta una
sola vez, en su propia carpeta:

```yaml
services:
  nginx-proxy:
    container_name: nginx-proxy
    image: nginxproxy/nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./nginx-proxy/volumes/vhost.d/:/etc/nginx/vhost.d
      - ./nginx-proxy/volumes/conf.d:/etc/nginx/conf.d
      - ./nginx-proxy/volumes/certs:/etc/nginx/certs
      - ./nginx-proxy/volumes/html:/usr/share/nginx/html
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "3"
    networks:
      - dockers_default

  nginx-proxy-acme:
    container_name: nginx-proxy-acme
    image: nginxproxy/acme-companion
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./nginx-proxy/volumes/vhost.d/:/etc/nginx/vhost.d
      - ./nginx-proxy/volumes/conf.d:/etc/nginx/conf.d
      - ./nginx-proxy/volumes/certs:/etc/nginx/certs
      - ./nginx-proxy/volumes/html:/usr/share/nginx/html
      - ./nginx-proxy/volumes/acme/:/etc/acme.sh
    environment:
      - NGINX_PROXY_CONTAINER=nginx-proxy
      - DEBUG=true
      - DEFAULT_EMAIL=name@domain.com

networks:
  dockers_default:
    external: true
```

```bash
docker compose up -d
```

:::info El nombre de la red
Los dos contenedores y las aplicaciones tienen que compartir la misma red de Docker.
Comprueba cómo se llama la tuya con:

```bash
docker network ls
```

En el servidor actual es `docker_default` (la red del stack `docker`). Usa ese nombre
en el `networks:` de arriba y en el de cada aplicación.
:::

Cambia `DEFAULT_EMAIL` por un correo real: es donde Let's Encrypt avisa si un
certificado no se renueva.

## 3. Publicar una aplicación

A partir de aquí, publicar cualquier aplicación es **añadirle unas variables de
entorno**. El proxy la detecta sola y le pide el certificado.

```yaml
services:
  mi-aplicacion:
    build: .
    restart: unless-stopped
    environment:
      VIRTUAL_HOST: mi-dominio.ejemplo.com
      VIRTUAL_PORT: 80
      LETSENCRYPT_HOST: mi-dominio.ejemplo.com
      LETSENCRYPT_EMAIL: name@domain.com
    networks:
      - proxy

networks:
  proxy:
    external: true
    name: docker_default
```

Qué significa cada una:

| Variable | Para qué sirve |
| --- | --- |
| `VIRTUAL_HOST` | El dominio que servirá este contenedor. |
| `VIRTUAL_PORT` | El puerto **dentro del contenedor** (normalmente `80`). |
| `LETSENCRYPT_HOST` | El dominio para el que se pide el certificado. Casi siempre igual que `VIRTUAL_HOST`. |
| `LETSENCRYPT_EMAIL` | Avisos de caducidad. Opcional si `DEFAULT_EMAIL` ya está puesto en acme-companion. |

:::warning `VIRTUAL_PORT` es el puerto interno, no uno del anfitrión
Es `80` porque es donde escucha Nginx **dentro** del contenedor. El proxy conecta por
la red interna de Docker, así que la aplicación **no debe publicar puertos**:
`ports:` sobra y sólo serviría para exponerla por fuera del proxy.
:::

## 4. Desplegar Zertipower

Clona el repositorio y crea el `.env` con los dominios reales:

```bash
git clone https://github.com/zertifier/zertipower-zertibuilder.git && cd zertipower-zertibuilder
```

```bash
cp .env.example .env
```

Edita `.env` con los valores de producción — como mínimo:

```bash
PUBLIC_API_URL=https://api.tudominio.com
JWT_SECRET=<cadena-larga-y-aleatoria>
DB_PASSWORD=<contraseña-fuerte>
```

Y arranca:

```bash
docker compose up -d
```

:::danger Antes de exponerlo a Internet
- Cambia `JWT_SECRET` y `DB_PASSWORD`. Los valores por defecto son para desarrollo.
- Cambia la contraseña del usuario `admin`, o bórralo.
- No publiques el puerto `3306`.
:::

## 5. Comprobaciones

- [ ] `https://<dominio>` carga y el candado del navegador es válido.
- [ ] `http://<dominio>` redirige a `https://`.
- [ ] El login funciona.
- [ ] `3306` **no** responde desde fuera del servidor.
- [ ] Hay copias de seguridad programadas de la base de datos.

## Si sale 503

Es el error más habitual y casi siempre significa lo mismo: **el proxy no encuentra
ningún contenedor que reclame ese dominio.**

1. ¿El contenedor está en la **misma red** que `nginx-proxy`?
2. ¿Tiene bien escrito `VIRTUAL_HOST`?
3. ¿Está arrancado? — `docker compose ps`

Los registros del proxy suelen decir exactamente qué falta:

```bash
docker logs nginx-proxy
```
