+++
title = 'Primers Passos'
date = 2024-03-27T11:09:44+01:00
draft = true
+++

### Backend

Un cop tot preparat ens dirigim a la carpeta "backend" i instalem tots els paquets necessaris.

```console
npm i
```

Després importem la base de dades que hi ha a la ruta /backend/backups/database.sql
Un cop importada la base de dades generem la classe Prisma amb la comanda:

```console
npx prisma generate
```

I iniciem el servidor amb: 
```console
nest start
```

Per veure les consultes disponibles hem d'anar al 'Swagger' que esta en aquesta URL:
{urlDelServidor}/api

### Frontend
Ara anem a la ruta /frontend i fem servir la comanda:

```console
npm i --force
```

I per iniciar la pàgina:
```console
ng serve
```